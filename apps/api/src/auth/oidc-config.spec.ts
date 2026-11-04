import { describe, expect, it } from 'vitest';
import { readOidcConfig } from './oidc-config';

describe('OIDC configuration', () => {
  it('fails closed when required provider configuration is missing', () => {
    expect(() => readOidcConfig({})).toThrow('OIDC is not configured');
  });

  it('reads issuer, audience, and JWKS URL without exposing secrets', () => {
    expect(
      readOidcConfig({
        OIDC_ISSUER: 'https://issuer.test',
        OIDC_AUDIENCE: 'api',
        OIDC_JWKS_URL: 'https://issuer.test/jwks',
      }),
    ).toEqual({
      issuer: 'https://issuer.test',
      audience: 'api',
      jwksUrl: 'https://issuer.test/jwks',
    });
  });

  it('prefers Keycloak configuration for the approved provider', () => {
    expect(
      readOidcConfig({
        KEYCLOAK_ISSUER: 'http://keycloak/realms/expense-tracker',
        KEYCLOAK_AUDIENCE: 'api',
        KEYCLOAK_JWKS_URL: 'http://keycloak/certs',
        OIDC_ISSUER: 'https://wrong.example',
      }),
    ).toEqual({
      issuer: 'http://keycloak/realms/expense-tracker',
      audience: 'api',
      jwksUrl: 'http://keycloak/certs',
    });
  });
});
