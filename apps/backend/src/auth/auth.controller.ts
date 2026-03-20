import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { S3UploadService } from '../upload/s3-upload.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly s3UploadService: S3UploadService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute (OAuth redirect)
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Request() req: any) {
    const result = await this.authService.validateOAuthUser(req.user, 'google');
    // For web, redirect to frontend with token
    // For mobile, return JSON with token
    return result;
  }

  @Post('google/mobile')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute
  async googleAuthMobile(
    @Body()
    body: { code: string; redirectUri: string; codeVerifier?: string; appRole?: 'homeowner' | 'general_contractor' },
  ) {
    // Handle mobile OAuth flow
    // Exchange authorization code for user info
    const { code, redirectUri, codeVerifier, appRole } = body;

    if (!code || !redirectUri) {
      throw new BadRequestException('Missing code or redirect URI');
    }

    try {
      const params = new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });
      // Required when the client used PKCE in the authorization request (Expo default).
      if (codeVerifier) {
        params.append('code_verifier', codeVerifier);
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange error:', errorText);
        throw new UnauthorizedException('Google sign-in failed. Please try again.');
      }

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new UnauthorizedException('Google sign-in failed. Please try again.');
      }
      
      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error('User info error:', errorText);
        throw new UnauthorizedException('Google sign-in failed. Please try again.');
      }

      const userInfo = await userInfoResponse.json();

      if (!userInfo.email) {
        throw new UnauthorizedException('Google sign-in failed. Email is required.');
      }

      // Create user profile object similar to what passport-google-oauth20 returns
      const profile = {
        email: userInfo.email,
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        name: userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim(),
        picture: userInfo.picture || '',
      };

      // Validate and create/login user
      const result = await this.authService.validateOAuthUser(profile, 'google', appRole);
      return result;
    } catch (error: any) {
      console.error('Mobile OAuth error:', error);
      // Re-throw NestJS HTTP exceptions as-is so clients get proper status codes
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Google sign-in failed. Please try again.');
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    return this.authService.getCurrentUser(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateCurrentUser(@Request() req: any, @Body() updateMeDto: UpdateMeDto) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    return this.authService.updateCurrentUser(userId, updateMeDto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    return this.authService.changePassword(userId, {
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }

  @Post('me/picture')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        const ext = extname(file.originalname || '').toLowerCase();
        const allowedImageExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']);
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|heic|heif)$/) || !allowedImageExts.has(ext)) {
          return callback(new BadRequestException('Only image files are allowed'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async uploadProfilePicture(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const uploaded = await this.s3UploadService.uploadBuffer({
      buffer: file.buffer,
      folder: 'profiles',
      contentType: file.mimetype,
      originalName: file.originalname,
    });
    const pictureUrl = uploaded.url;

    return this.authService.updateProfilePicture(userId, pictureUrl);
  }
}
