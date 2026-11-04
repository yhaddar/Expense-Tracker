import { describe, expect, it } from 'vitest';
import { retentionUntilForArchive } from './attachment-validation';

describe('attachment retention', () => {
  it('retains attachments for seven years after transaction archival', () => {
    expect(
      retentionUntilForArchive(
        new Date('2026-11-04T12:00:00.000Z'),
      ).toISOString(),
    ).toBe('2033-11-04T12:00:00.000Z');
  });
});
