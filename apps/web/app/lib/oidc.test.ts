import { describe, expect, it } from 'vitest';
import { validateCallbackState } from './oidc';

describe('OIDC callback safety', () => {
  it('accepts only an exact state match', () => {
    expect(validateCallbackState('state-123', 'state-123')).toBe(true);
    expect(validateCallbackState('state-other', 'state-123')).toBe(false);
    expect(validateCallbackState(null, 'state-123')).toBe(false);
  });
});
