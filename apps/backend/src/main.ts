import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response } from 'express';
import * as express from 'express';
import { existsSync } from 'fs';
import { webcrypto } from 'crypto';

// Nest schedule module expects a global Web Crypto API in some runtime paths.
// Ensure it exists on Node 18 so scheduler bootstrap does not crash in ECS.
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // We add custom body parser to support Stripe webhook raw body
  });

  // Raw body for Stripe webhook signature verification (must be before JSON parser)
  const webhookPath = '/api/payments/webhooks/stripe';
  app.use(
    express.json({
      verify: (req: any, _res, buf: Buffer, encoding: BufferEncoding) => {
        if (req.originalUrl === webhookPath && buf?.length) {
          req.rawBody = buf.toString(encoding || 'utf8');
        }
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const trustedDomainPatterns = [
    /^https:\/\/([a-z0-9-]+\.)?buildmyhouse\.app$/i,
    /^https:\/\/([a-z0-9-]+\.)?buildmyhouse\.com$/i,
  ];

  // Enable CORS with explicit production allowlist
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // In development, allow all localhost origins for local web app testing
      if (
        !isProduction &&
        (origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:'))
      ) {
        return callback(null, true);
      }

      // In all environments, allow explicit configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Production safety net for first-party web apps (covers cases where env allowlist is stale)
      if (trustedDomainPatterns.some((pattern) => pattern.test(origin))) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Serve static files from uploads directory.
  // Keep this AFTER CORS setup so browser requests for /uploads/* include CORS headers.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Legacy asset URL compatibility:
  // Older records may store "/uploads/..." paths while files live in S3 in production.
  // If local file is missing and S3 is configured, redirect to canonical S3 object URL.
  app.getHttpAdapter().get('/uploads/*', (req: Request, res: Response) => {
    const relPath = String(req.path || '').replace(/^\/+/, '');
    const localPath = join(process.cwd(), relPath);
    if (existsSync(localPath)) {
      return res.sendFile(localPath);
    }

    const bucket = (process.env.AWS_S3_BUCKET || '').trim();
    const region = (process.env.AWS_REGION || '').trim();
    const publicBase = (process.env.AWS_S3_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');

    if (bucket && region) {
      const target = publicBase
        ? `${publicBase}/${relPath}`
        : `https://${bucket}.s3.${region}.amazonaws.com/${relPath}`;
      return res.redirect(302, target);
    }

    return res.status(404).json({
      message: `Cannot GET ${req.path}`,
      error: 'Not Found',
      statusCode: 404,
    });
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert string to number
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Health check endpoint
  app.getHttpAdapter().get('/api/health', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend API running on: http://localhost:${port}/api`);
  console.log(`🔌 WebSocket server ready for real-time connections`);
  console.log(`💚 Health check available at: http://localhost:${port}/api/health`);
}

bootstrap();

