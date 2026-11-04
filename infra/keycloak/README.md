# Local Keycloak setup

Keycloak is the approved OIDC provider. This directory documents the local,
disposable integration boundary only; it contains no realm export, client
secret, admin password, token, or production configuration.

Create a local realm named `expense-tracker`, an API client whose audience is
`expense-tracker-api`, and a browser client configured for the local web origin.
Set the API variables from `apps/api/.env.example` to the realm issuer and its
OpenID Connect certificates endpoint.

## Current repository blocker

The repository currently contains the API issuer/audience/JWKS settings only.
It does not contain a realm export or the browser client ID, client access type,
allowed redirect URI, post-logout redirect URI, or web-origin settings. The API
audience (`expense-tracker-api`) must not be reused as the browser client ID.
Until the disposable realm has an approved public browser client and those
settings are supplied through the existing deployment configuration, Atlas
Ledger cannot safely construct an Authorization Code + PKCE request or exchange
the callback code. No login, registration, recovery, logout, or browser-session
success is claimed.

Required verification before identity is marked complete:

1. Start an isolated Keycloak instance with synthetic users only.
2. Complete browser login and callback using the configured client.
3. Call a protected API endpoint with a valid token and verify the mapped
   subject and wallet membership.
4. Verify an expired, wrong-issuer, wrong-audience, and missing-key token is
   rejected without leaking claims or provider details.
5. Revoke the application session and verify subsequent protected requests are
   rejected.

No production Keycloak realm or external identity resource is created by this
repository.
