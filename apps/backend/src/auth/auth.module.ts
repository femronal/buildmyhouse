import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthService } from './jwt-auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './rbac.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    PassportModule,
    forwardRef(() => WebSocketModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret || !secret.trim()) {
          throw new Error('JWT_SECRET is required. Set it in your .env file.');
        }
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthService, JwtAuthGuard, RolesGuard, GoogleStrategy],
  exports: [AuthService, JwtAuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
