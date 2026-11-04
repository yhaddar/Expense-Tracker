import { describe, expect, it } from 'vitest';
import { HealthController, IdentityController } from './app.module';

describe('health endpoint contract', () => {
  it('returns a versioned healthy response', () => {
    expect(new HealthController().health()).toEqual({
      status: 'ok',
      service: 'expense-tracker-api',
      version: 'v1',
    });
  });
});

describe('identity endpoint contract', () => {
  it('returns only the authenticated identity context', () => {
    expect(
      new IdentityController().me({
        user: {
          subject: 'user-1',
          email: 'user@example.test',
          claims: { secret: 'not returned' },
        },
      } as never),
    ).toEqual({ subject: 'user-1', email: 'user@example.test' });
  });
});
