import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL =
      configService.get<string>('GOOGLE_CALLBACK_URL') ||
      'http://localhost:3001/api/auth/google/callback';

    // Keep API startup healthy in environments where Google OAuth is not configured yet.
    // Routes using AuthGuard('google') will still require valid credentials to work.
    if (!clientID || !clientSecret) {
      console.warn(
        '[Auth] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set. Google OAuth strategy is disabled.',
      );
      super({
        clientID: 'disabled-google-client-id',
        clientSecret: 'disabled-google-client-secret',
        callbackURL,
        scope: ['email', 'profile'],
      });
      return;
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      name: name?.displayName || `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
      picture: photos?.[0]?.value || '',
      accessToken,
      provider: 'google',
    };
    done(null, user);
  }
}




