import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Request() req: any) {
    const result = await this.authService.validateOAuthUser(req.user, 'google');
    // For web, redirect to frontend with token
    // For mobile, return JSON with token
    return result;
  }

  @Post('google/mobile')
  async googleAuthMobile(@Body() body: { code: string; redirectUri: string }) {
    // Handle mobile OAuth flow
    // Exchange authorization code for user info
    const { code, redirectUri } = body;
    
    if (!code || !redirectUri) {
      throw new Error('Missing code or redirectUri');
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange error:', errorText);
        throw new Error(`Failed to exchange code for token: ${errorText}`);
      }

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
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
        throw new Error(`Failed to get user info: ${errorText}`);
      }

      const userInfo = await userInfoResponse.json();

      if (!userInfo.email) {
        throw new Error('No email received from Google');
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
      const result = await this.authService.validateOAuthUser(profile, 'google');
      return result;
    } catch (error: any) {
      console.error('Mobile OAuth error:', error);
      throw new Error(`Mobile OAuth error: ${error.message || 'Unknown error'}`);
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
}
