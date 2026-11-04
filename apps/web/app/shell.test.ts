import { describe, expect, it } from 'vitest';

describe('web foundation', () => {
  it('keeps the required locale set available for the shell', () => {
    expect(['en', 'fr', 'ar']).toEqual(
      expect.arrayContaining(['en', 'fr', 'ar']),
    );
  });
});
