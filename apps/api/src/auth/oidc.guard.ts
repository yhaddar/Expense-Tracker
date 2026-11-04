import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { readOidcConfig } from './oidc-config';

export type AuthenticatedUser = {
  subject: string;
  email?: string;
  claims: Record<string, unknown>;
};

@Injectable()
export class OidcGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthenticatedUser;
    }>();
    const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token)
      throw new UnauthorizedException('Bearer authentication is required');
    try {
      const config = readOidcConfig();
      const result = await jwtVerify(
        token,
        createRemoteJWKSet(new URL(config.jwksUrl)),
        { issuer: config.issuer, audience: config.audience },
      );
      const subject = result.payload.sub;
      if (!subject) throw new Error('OIDC subject is missing');
      const user: AuthenticatedUser = {
        subject,
        claims: result.payload as Record<string, unknown>,
      };
      if (typeof result.payload.email === 'string')
        user.email = result.payload.email;
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('OIDC authentication failed');
    }
  }
}
