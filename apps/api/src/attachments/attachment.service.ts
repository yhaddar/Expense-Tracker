import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  auditEvents,
  idempotencyKeys,
  transactionAttachments,
  transactionRecords,
  type Database,
} from '@expense-tracker/db';
import type { AuthenticatedUser } from '../auth/oidc.guard';
import { IdentityService } from '../identity/identity.service';
import { validateAttachmentBase64 } from './attachment-validation';
import { retentionUntilForArchive } from './attachment-validation';
import type { PrivateAttachmentStore } from './attachment.store';
import type { AttachmentScanner } from './clamav.scanner';
import { ClamAvScanner } from './clamav.scanner';
import { purgeExpiredAttachments } from './retention';

@Injectable()
export class AttachmentService {
  constructor(
    @Inject('DB') private readonly db: Database | null,
    @Inject(IdentityService) private readonly identity: IdentityService,
    @Inject('ATTACHMENT_STORE')
    private readonly storage: PrivateAttachmentStore,
    @Inject('ATTACHMENT_SCANNER')
    private readonly scanner: AttachmentScanner,
  ) {}

  private database(): Database {
    if (!this.db)
      throw new ServiceUnavailableException('Database is not configured');
    return this.db;
  }

  async upload(
    user: AuthenticatedUser,
    transactionId: string,
    input: { filename: string; contentBase64: string },
    operationKey: string | undefined,
  ) {
    const db = this.database();
    const { userId, walletId } = await this.identity.provisionUser(user);
    if (!operationKey)
      throw new ConflictException('Idempotency-Key is required');
    await this.identity.requirePermission(userId, walletId, 'attachments:read');
    const transaction = (
      await db
        .select()
        .from(transactionRecords)
        .where(
          and(
            eq(transactionRecords.id, transactionId),
            eq(transactionRecords.walletId, walletId),
          ),
        )
        .limit(1)
    )[0];
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.archivedAt)
      throw new ConflictException(
        'Archived transactions cannot receive new attachments',
      );
    const filename = input.filename?.trim();
    if (!filename || filename.length > 255)
      throw new ConflictException('Attachment filename is invalid');
    const validated = validateAttachmentBase64(input.contentBase64);
    const requestHash = `${transactionId}:${filename}:${validated.sha256}`;
    const existing = (
      await db
        .select()
        .from(idempotencyKeys)
        .where(
          and(
            eq(idempotencyKeys.userId, userId),
            eq(idempotencyKeys.operationKey, operationKey),
          ),
        )
        .limit(1)
    )[0];
    if (existing) {
      if (existing.requestHash !== requestHash || !existing.responseBody)
        throw new ConflictException(
          'Idempotency key was reused or is still processing',
        );
      return existing.responseBody;
    }
    const scanResult = await this.scanner.scan(validated.bytes);
    const id = randomUUID();
    const objectKey = this.storage.key(id);
    if (scanResult === 'infected') {
      const response = {
        id,
        transactionId,
        contentType: validated.contentType,
        sizeBytes: validated.bytes.length,
        status: 'quarantined' as const,
      };
      await db.transaction(async (tx) => {
        await tx.insert(transactionAttachments).values({
          id,
          walletId,
          transactionId,
          uploaderId: userId,
          objectKey,
          originalFilename: filename,
          detectedContentType: validated.contentType,
          sizeBytes: BigInt(validated.bytes.length),
          sha256: validated.sha256,
          status: 'quarantined',
        });
        await tx.insert(idempotencyKeys).values({
          userId,
          operationKey,
          requestHash,
          responseStatus: 422,
          responseBody: response,
        });
        await tx.insert(auditEvents).values({
          id: randomUUID(),
          walletId,
          actorId: userId,
          action: 'attachment.quarantined',
          entityType: 'transaction_attachment',
          entityId: id,
          metadata: { transactionId, reason: 'clamav-detection' },
        });
      });
      return response;
    }
    await db.transaction(async (tx) => {
      await tx.insert(transactionAttachments).values({
        id,
        walletId,
        transactionId,
        uploaderId: userId,
        objectKey,
        originalFilename: filename,
        detectedContentType: validated.contentType,
        sizeBytes: BigInt(validated.bytes.length),
        sha256: validated.sha256,
        status: 'pending',
      });
      await tx.insert(idempotencyKeys).values({
        userId,
        operationKey,
        requestHash,
        responseStatus: 201,
        responseBody: null,
      });
    });
    try {
      await this.storage.put(objectKey, validated.bytes, validated.contentType);
    } catch (error) {
      await db.transaction(async (tx) => {
        await tx
          .update(transactionAttachments)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(transactionAttachments.id, id));
        await tx
          .delete(idempotencyKeys)
          .where(
            and(
              eq(idempotencyKeys.userId, userId),
              eq(idempotencyKeys.operationKey, operationKey),
            ),
          );
      });
      throw error;
    }
    const response = {
      id,
      transactionId,
      contentType: validated.contentType,
      sizeBytes: validated.bytes.length,
      status: 'clean' as const,
    };
    try {
      await db.transaction(async (tx) => {
        await tx.insert(auditEvents).values({
          id: randomUUID(),
          walletId,
          actorId: userId,
          action: 'attachment.uploaded',
          entityType: 'transaction_attachment',
          entityId: id,
          metadata: { transactionId, status: 'clean', scanner: 'clamav' },
        });
        await tx
          .update(idempotencyKeys)
          .set({ responseBody: response })
          .where(
            and(
              eq(idempotencyKeys.userId, userId),
              eq(idempotencyKeys.operationKey, operationKey),
            ),
          );
        await tx
          .update(transactionAttachments)
          .set({ status: 'clean', updatedAt: new Date() })
          .where(eq(transactionAttachments.id, id));
      });
    } catch (error) {
      // The object must not outlive the metadata transaction if finalization fails.
      await this.storage.delete(objectKey).catch(() => undefined);
      throw error;
    }
    return response;
  }

  async download(user: AuthenticatedUser, attachmentId: string) {
    const db = this.database();
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(userId, walletId, 'attachments:read');
    const row = (
      await db
        .select()
        .from(transactionAttachments)
        .where(
          and(
            eq(transactionAttachments.id, attachmentId),
            eq(transactionAttachments.walletId, walletId),
          ),
        )
        .limit(1)
    )[0];
    if (!row) throw new NotFoundException('Attachment not found');
    if (row.status !== 'clean')
      throw new ForbiddenException(
        'Attachment is not available until scanning is complete',
      );
    const object = await this.storage.get(row.objectKey);
    return { ...object, filename: row.originalFilename };
  }

  async purgeExpired(now = new Date()): Promise<{ purged: number }> {
    const db = this.database();
    return purgeExpiredAttachments(db, this.storage, now);
  }
}
