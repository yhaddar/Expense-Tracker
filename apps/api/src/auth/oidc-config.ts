export type OidcConfig = { issuer: string; audience: string; jwksUrl: string };

export function readOidcConfig(
  env: NodeJS.ProcessEnv = process.env,
): OidcConfig {
  const issuer = env.KEYCLOAK_ISSUER ?? env.OIDC_ISSUER;
  const audience = env.KEYCLOAK_AUDIENCE ?? env.OIDC_AUDIENCE;
  const jwksUrl = env.KEYCLOAK_JWKS_URL ?? env.OIDC_JWKS_URL;
  if (!issuer || !audience || !jwksUrl)
    throw new Error('OIDC is not configured');
  return { issuer, audience, jwksUrl };
}
