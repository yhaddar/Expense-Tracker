import { describe, expect, it } from 'vitest';
import { validateAttachmentBase64 } from './attachment-validation';

describe('attachment validation', () => {
  it('detects file type from bytes instead of trusting a client MIME type', () => {
    const result = validateAttachmentBase64(
      Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString('base64'),
    );
    expect(result.contentType).toBe('image/jpeg');
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects unsupported content', () => {
    expect(() =>
      validateAttachmentBase64(Buffer.from('not an image').toString('base64')),
    ).toThrow('Only JPG, PNG, and PDF attachments are supported');
  });

  it('rejects files larger than 10 MB', () => {
    const bytes = Buffer.alloc(10 * 1024 * 1024 + 1, 0);
    expect(() => validateAttachmentBase64(bytes.toString('base64'))).toThrow(
      'between 1 byte and 10 MB',
    );
  });
});
