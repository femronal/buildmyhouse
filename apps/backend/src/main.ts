import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response } from 'express';
import * as express from 'express';

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

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

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

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
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

