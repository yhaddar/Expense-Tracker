import { createHash } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_RETENTION_YEARS_AFTER_ARCHIVE = 7;

export function retentionUntilForArchive(archivedAt: Date): Date {
  const retentionUntil = new Date(archivedAt.getTime());
  retentionUntil.setUTCFullYear(
    retentionUntil.getUTCFullYear() + ATTACHMENT_RETENTION_YEARS_AFTER_ARCHIVE,
  );
  return retentionUntil;
}

export type ValidatedAttachment = {
  bytes: Buffer;
  contentType: 'image/jpeg' | 'image/png' | 'application/pdf';
  sha256: string;
};

export function validateAttachmentBase64(
  contentBase64: string,
): ValidatedAttachment {
  if (typeof contentBase64 !== 'string' || !contentBase64)
    throw new BadRequestException('Attachment content is required');
  const normalized = contentBase64.replace(/^data:[^;]+;base64,/, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized))
    throw new BadRequestException('Attachment content must be base64');
  const bytes = Buffer.from(normalized, 'base64');
  if (!bytes.length || bytes.length > MAX_ATTACHMENT_BYTES)
    throw new BadRequestException(
      'Attachment must be between 1 byte and 10 MB',
    );
  let contentType: ValidatedAttachment['contentType'] | undefined;
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    contentType = 'image/jpeg';
  else if (
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    contentType = 'image/png';
  else if (bytes.subarray(0, 5).toString('ascii') === '%PDF-')
    contentType = 'application/pdf';
  if (!contentType)
    throw new BadRequestException(
      'Only JPG, PNG, and PDF attachments are supported',
    );
  return {
    bytes,
    contentType,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}
