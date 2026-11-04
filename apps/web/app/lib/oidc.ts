export type PkceTransaction = {
  state: string;
  nonce: string;
  codeVerifier: string;
  codeChallenge: string;
  createdAt: number;
};

const AUTH_TRANSACTION_KEY = 'atlas-ledger:oidc-transaction';

function randomUrlSafe(bytes = 32) {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return btoa(String.fromCharCode(...values))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export async function createPkceTransaction(): Promise<PkceTransaction> {
  const codeVerifier = randomUrlSafe(48);
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  const transaction = {
    state: randomUrlSafe(),
    nonce: randomUrlSafe(),
    codeVerifier,
    codeChallenge,
    createdAt: Date.now(),
  };
  sessionStorage.setItem(AUTH_TRANSACTION_KEY, JSON.stringify(transaction));
  return transaction;
}

export function readPkceTransaction(): PkceTransaction | null {
  const raw = sessionStorage.getItem(AUTH_TRANSACTION_KEY);
  if (!raw) return null;
  try {
    const transaction = JSON.parse(raw) as PkceTransaction;
    if (
      typeof transaction.state !== 'string' ||
      typeof transaction.nonce !== 'string' ||
      typeof transaction.codeVerifier !== 'string' ||
      typeof transaction.codeChallenge !== 'string' ||
      typeof transaction.createdAt !== 'number'
    )
      return null;
    return transaction;
  } catch {
    return null;
  }
}

export function clearPkceTransaction() {
  sessionStorage.removeItem(AUTH_TRANSACTION_KEY);
}

export function validateCallbackState(state: string | null, expected: string) {
  return Boolean(state && state === expected);
}

export const oidcTransactionStorageKey = AUTH_TRANSACTION_KEY;
