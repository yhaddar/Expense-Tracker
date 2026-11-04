import { createHash, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import {
  appUsers,
  auditEvents,
  categories,
  financialAccounts,
  idempotencyKeys,
  rolePermissions,
  transactionRecords,
  transactionAttachments,
  walletMemberships,
  type Database,
} from '@expense-tracker/db';
import type { AuthenticatedUser } from '../auth/oidc.guard';
import { IdentityService } from '../identity/identity.service';
import { retentionUntilForArchive } from '../attachments/attachment-validation';

export type CreateTransactionInput = {
  transactionType: 'income' | 'expense';
  amountMinor: string;
  currency: string;
  amountMadMinor: string;
  exchangeRate: string;
  rateTimestamp?: string;
  rateSource?: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_payment';
  transactionDate: string;
  note?: string;
};

export type TransactionResponse = {
  id: string;
  transactionType:
    | 'income'
    | 'expense'
    | 'refund'
    | 'transfer_debit'
    | 'transfer_credit';
  amountMinor: string;
  currency: string;
  amountMadMinor: string;
  exchangeRate: string;
  paymentMethod: string;
  transactionDate: string;
  version: number;
};

export type TransferInput = {
  targetUserId: string;
  amountMinor: string;
  currency: string;
  amountMadMinor: string;
  exchangeRate: string;
  rateTimestamp?: string;
  rateSource?: string;
  paymentMethod: CreateTransactionInput['paymentMethod'];
  transactionDate: string;
  note?: string;
};

export type TransferResponse = {
  transferGroupId: string;
  debit: TransactionResponse;
  credit: TransactionResponse;
};

export const PAYMENT_METHODS = [
  'cash',
  'card',
  'bank_transfer',
  'mobile_payment',
] as const;

export function isValidMoroccoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function isPositiveInteger(value: unknown): value is string {
  return typeof value === 'string' && /^\d+$/.test(value) && BigInt(value) > 0n;
}

function isPositiveDecimal(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^(?:0|[1-9]\d*)(?:\.\d{1,12})?$/.test(value) &&
    value !== '0' &&
    !/^0\.0+$/.test(value)
  );
}

export function validateTransactionInput(
  input: Partial<CreateTransactionInput>,
): asserts input is CreateTransactionInput {
  if (!input || typeof input !== 'object')
    throw new BadRequestException('Transaction body is required');
  if (input.transactionType !== 'income' && input.transactionType !== 'expense')
    throw new BadRequestException('Transaction type is invalid');
  if (!isPositiveInteger(input.amountMinor))
    throw new BadRequestException(
      'Amount must be a positive integer minor-unit value',
    );
  if (!/^[A-Z]{3}$/.test(input.currency ?? ''))
    throw new BadRequestException(
      'Currency must be a three-letter uppercase code',
    );
  if (!isPositiveInteger(input.amountMadMinor))
    throw new BadRequestException(
      'MAD amount must be a positive integer minor-unit value',
    );
  if (!isPositiveDecimal(input.exchangeRate))
    throw new BadRequestException('Exchange rate must be a positive decimal');
  if (!isValidMoroccoDate(input.transactionDate))
    throw new BadRequestException(
      'Transaction date must be a valid Morocco UTC date',
    );
  if (
    !(PAYMENT_METHODS as readonly string[]).includes(input.paymentMethod ?? '')
  )
    throw new BadRequestException('Payment method is invalid');
  if (
    input.note !== undefined &&
    (typeof input.note !== 'string' || input.note.length > 2000)
  )
    throw new BadRequestException('Note must be 2,000 characters or fewer');
  if (
    input.rateTimestamp !== undefined &&
    Number.isNaN(Date.parse(input.rateTimestamp))
  )
    throw new BadRequestException('Rate timestamp must be a valid ISO date');
  if (
    input.rateSource !== undefined &&
    (typeof input.rateSource !== 'string' || input.rateSource.length > 120)
  )
    throw new BadRequestException(
      'Rate source must be 120 characters or fewer',
    );
}

@Injectable()
export class LedgerService {
  constructor(
    @Inject('DB') private readonly db: Database | null,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  private requireDatabase(): Database {
    if (!this.db)
      throw new ServiceUnavailableException('Database is not configured');
    return this.db;
  }

  async listCategories(user: AuthenticatedUser) {
    const db = this.requireDatabase();
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(
      userId,
      walletId,
      'transactions:read',
    );
    return db
      .select({
        id: categories.id,
        name: categories.name,
        isSystem: categories.isSystem,
      })
      .from(categories)
      .where(eq(categories.walletId, walletId));
  }

  async createCategory(user: AuthenticatedUser, nameInput: string) {
    const db = this.requireDatabase();
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(
      userId,
      walletId,
      'categories:manage',
    );
    const name = nameInput?.trim();
    if (!name || name.length > 80)
      throw new BadRequestException('Category name is invalid');
    const id = randomUUID();
    try {
      await db.transaction(async (tx) => {
        await tx
          .insert(categories)
          .values({ id, walletId, name, isSystem: false });
        await tx.insert(auditEvents).values({
          id: randomUUID(),
          walletId,
          actorId: userId,
          action: 'category.created',
          entityType: 'category',
          entityId: id,
          metadata: { name },
        });
      });
    } catch (error) {
      const databaseError = error as { cause?: { code?: string } };
      if (databaseError.cause?.code === '23505')
        throw new ConflictException('A category with this name already exists');
      throw error;
    }
    return { id, name, isSystem: false };
  }

  async create(
    user: AuthenticatedUser,
    operationKey: string | undefined,
    input: CreateTransactionInput,
  ): Promise<TransactionResponse> {
    const db = this.requireDatabase();
    if (!operationKey)
      throw new ConflictException('Idempotency-Key is required');
    validateTransactionInput(input);
    const { userId, walletId } = await this.identity.provisionUser(user);
    const permissions = await db
      .select({ permission: rolePermissions.permission })
      .from(walletMemberships)
      .innerJoin(
        rolePermissions,
        eq(walletMemberships.roleId, rolePermissions.roleId),
      )
      .where(
        and(
          eq(walletMemberships.userId, userId),
          eq(walletMemberships.walletId, walletId),
        ),
      );
    if (!permissions.some((row) => row.permission === 'transactions:create'))
      throw new ForbiddenException('Transaction creation is not permitted');
    const requestHash = createHash('sha256')
      .update(JSON.stringify(input))
      .digest('hex');
    return db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(idempotencyKeys)
        .where(
          and(
            eq(idempotencyKeys.userId, userId),
            eq(idempotencyKeys.operationKey, operationKey),
          ),
        )
        .limit(1);
      if (existing[0]) {
        if (existing[0].requestHash !== requestHash)
          throw new ConflictException(
            'Idempotency key was reused with a different request',
          );
        if (!existing[0].responseBody)
          throw new ConflictException(
            'Idempotent operation has no stored response',
          );
        return existing[0].responseBody as TransactionResponse;
      }
      const id = randomUUID();
      const rows = await tx
        .insert(transactionRecords)
        .values({
          id,
          walletId,
          accountId:
            (
              await tx
                .select({ id: financialAccounts.id })
                .from(financialAccounts)
                .where(eq(financialAccounts.userId, userId))
                .limit(1)
            )[0]?.id ??
            (() => {
              throw new ConflictException(
                'Financial account setup is required',
              );
            })(),
          creatorId: userId,
          transactionType: input.transactionType,
          amountMinor: BigInt(input.amountMinor),
          currency: input.currency,
          amountMadMinor: BigInt(input.amountMadMinor),
          exchangeRate: input.exchangeRate,
          rateTimestamp: input.rateTimestamp
            ? new Date(input.rateTimestamp)
            : null,
          rateSource: input.rateSource ?? null,
          paymentMethod: input.paymentMethod,
          transactionDate: input.transactionDate,
          note: input.note ?? null,
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error('Transaction insert returned no row');
      const response: TransactionResponse = {
        id: row.id,
        transactionType:
          row.transactionType as TransactionResponse['transactionType'],
        amountMinor: row.amountMinor.toString(),
        currency: row.currency,
        amountMadMinor: row.amountMadMinor.toString(),
        exchangeRate: row.exchangeRate,
        paymentMethod: row.paymentMethod,
        transactionDate: row.transactionDate,
        version: row.version,
      };
      await tx.insert(auditEvents).values({
        id: randomUUID(),
        walletId,
        actorId: userId,
        action: 'transaction.created',
        entityType: 'transaction',
        entityId: id,
        metadata: {
          transactionType: input.transactionType,
          amountMadMinor: input.amountMadMinor,
        },
      });
      await tx.insert(idempotencyKeys).values({
        userId,
        operationKey,
        requestHash,
        responseStatus: 201,
        responseBody: response,
      });
      return response;
    });
  }

  async transfer(
    user: AuthenticatedUser,
    operationKey: string | undefined,
    input: TransferInput,
  ): Promise<TransferResponse> {
    const db = this.requireDatabase();
    if (!operationKey)
      throw new ConflictException('Idempotency-Key is required');
    validateTransactionInput({ ...input, transactionType: 'expense' });
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        input.targetUserId,
      )
    )
      throw new BadRequestException('Transfer target must be a valid user id');
    const { userId, walletId } = await this.identity.provisionUser(user);
    if (!input.targetUserId || input.targetUserId === userId)
      throw new ConflictException(
        'A transfer target must be another wallet member',
      );
    await this.identity.requirePermission(
      userId,
      walletId,
      'transactions:create',
    );
    const requestHash = createHash('sha256')
      .update(JSON.stringify(input))
      .digest('hex');

    return db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(idempotencyKeys)
        .where(
          and(
            eq(idempotencyKeys.userId, userId),
            eq(idempotencyKeys.operationKey, operationKey),
          ),
        )
        .limit(1);
      if (existing[0]) {
        if (
          existing[0].requestHash !== requestHash ||
          !existing[0].responseBody
        )
          throw new ConflictException(
            'Idempotency key was reused with a different request',
          );
        return existing[0].responseBody as TransferResponse;
      }

      const sourceAccount = (
        await tx
          .select({ id: financialAccounts.id })
          .from(financialAccounts)
          .where(eq(financialAccounts.userId, userId))
          .limit(1)
      )[0];
      if (!sourceAccount)
        throw new ConflictException('Financial account setup is required');
      const targetAccount = (
        await tx
          .select({ id: financialAccounts.id })
          .from(walletMemberships)
          .innerJoin(
            financialAccounts,
            eq(financialAccounts.userId, walletMemberships.userId),
          )
          .where(
            and(
              eq(walletMemberships.walletId, walletId),
              eq(walletMemberships.userId, input.targetUserId),
              eq(walletMemberships.status, 'active'),
            ),
          )
          .limit(1)
      )[0];
      if (!targetAccount)
        throw new ConflictException(
          'Transfer target has no active account in this Shared Wallet',
        );

      const transferGroupId = randomUUID();
      const debitId = randomUUID();
      const creditId = randomUUID();
      const common = {
        walletId,
        amountMinor: BigInt(input.amountMinor),
        currency: input.currency,
        amountMadMinor: BigInt(input.amountMadMinor),
        exchangeRate: input.exchangeRate,
        rateTimestamp: input.rateTimestamp
          ? new Date(input.rateTimestamp)
          : null,
        rateSource: input.rateSource ?? null,
        paymentMethod: input.paymentMethod,
        transactionDate: input.transactionDate,
        note: input.note ?? null,
        transferGroupId,
      };
      const rows = await tx
        .insert(transactionRecords)
        .values([
          {
            ...common,
            id: debitId,
            accountId: sourceAccount.id,
            creatorId: userId,
            transactionType: 'transfer_debit',
            linkedTransactionId: creditId,
          },
          {
            ...common,
            id: creditId,
            accountId: targetAccount.id,
            creatorId: userId,
            transactionType: 'transfer_credit',
            linkedTransactionId: debitId,
          },
        ])
        .returning();
      if (rows.length !== 2)
        throw new Error('Transfer did not create both ledger legs');
      const debitRow = rows.find((row) => row.id === debitId);
      const creditRow = rows.find((row) => row.id === creditId);
      if (!debitRow || !creditRow)
        throw new Error('Transfer legs are incomplete');
      const toResponse = (row: typeof debitRow): TransactionResponse => ({
        id: row.id,
        transactionType:
          row.transactionType as TransactionResponse['transactionType'],
        amountMinor: row.amountMinor.toString(),
        currency: row.currency,
        amountMadMinor: row.amountMadMinor.toString(),
        exchangeRate: row.exchangeRate,
        paymentMethod: row.paymentMethod,
        transactionDate: row.transactionDate,
        version: row.version,
      });
      const response = {
        transferGroupId,
        debit: toResponse(debitRow),
        credit: toResponse(creditRow),
      } satisfies TransferResponse;
      await tx.insert(auditEvents).values({
        id: randomUUID(),
        walletId,
        actorId: userId,
        action: 'transfer.created',
        entityType: 'transfer',
        entityId: transferGroupId,
        metadata: {
          debitId,
          creditId,
          sourceUserId: userId,
          targetUserId: input.targetUserId,
          amountMadMinor: input.amountMadMinor,
        },
      });
      await tx.insert(idempotencyKeys).values({
        userId,
        operationKey,
        requestHash,
        responseStatus: 201,
        responseBody: response,
      });
      return response;
    });
  }

  async list(user: AuthenticatedUser): Promise<TransactionResponse[]> {
    const db = this.requireDatabase();
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(
      userId,
      walletId,
      'transactions:read',
    );
    const rows = await db
      .select()
      .from(transactionRecords)
      .where(
        and(
          eq(transactionRecords.walletId, walletId),
          isNull(transactionRecords.archivedAt),
        ),
      )
      .orderBy(desc(transactionRecords.transactionDate));
    return rows.map((row) => ({
      id: row.id,
      transactionType:
        row.transactionType as TransactionResponse['transactionType'],
      amountMinor: row.amountMinor.toString(),
      currency: row.currency,
      amountMadMinor: row.amountMadMinor.toString(),
      exchangeRate: row.exchangeRate,
      paymentMethod: row.paymentMethod,
      transactionDate: row.transactionDate,
      version: row.version,
    }));
  }

  private async authorizedTransaction(
    user: AuthenticatedUser,
    transactionId: string,
    action: 'edit' | 'archive',
  ) {
    const db = this.requireDatabase();
    const { userId, walletId } = await this.identity.provisionUser(user);
    const row = (
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
    if (!row) throw new ConflictException('Transaction not found');
    if (
      row.transactionType === 'transfer_debit' ||
      row.transactionType === 'transfer_credit'
    )
      throw new ConflictException(
        'Transfer legs must be changed as one atomic transfer',
      );
    const grants = await db
      .select({ permission: rolePermissions.permission })
      .from(walletMemberships)
      .innerJoin(
        rolePermissions,
        eq(walletMemberships.roleId, rolePermissions.roleId),
      )
      .where(
        and(
          eq(walletMemberships.userId, userId),
          eq(walletMemberships.walletId, walletId),
        ),
      );
    const allowed =
      grants.some(
        (grant) => grant.permission === `transactions:${action}:any`,
      ) ||
      (row.creatorId === userId &&
        grants.some(
          (grant) => grant.permission === `transactions:${action}:own`,
        ));
    if (!allowed)
      throw new ForbiddenException('Transaction mutation is not permitted');
    return { db, userId, walletId, row };
  }

  async edit(
    user: AuthenticatedUser,
    transactionId: string,
    expectedVersion: number,
    patch: {
      note?: string;
      paymentMethod?: CreateTransactionInput['paymentMethod'];
      transactionDate?: string;
    },
  ): Promise<TransactionResponse> {
    const { db, userId, walletId, row } = await this.authorizedTransaction(
      user,
      transactionId,
      'edit',
    );
    if (row.version !== expectedVersion)
      throw new ConflictException('Transaction version is stale');
    const updated = (
      await db
        .update(transactionRecords)
        .set({
          note: patch.note ?? row.note,
          paymentMethod: patch.paymentMethod ?? row.paymentMethod,
          transactionDate: patch.transactionDate ?? row.transactionDate,
          version: row.version + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(transactionRecords.id, transactionId),
            eq(transactionRecords.version, expectedVersion),
          ),
        )
        .returning()
    )[0];
    if (!updated) throw new ConflictException('Transaction version is stale');
    await db.insert(auditEvents).values({
      id: randomUUID(),
      walletId,
      actorId: userId,
      action: 'transaction.edited',
      entityType: 'transaction',
      entityId: transactionId,
      metadata: {
        previousVersion: expectedVersion,
        newVersion: updated.version,
      },
    });
    return {
      id: updated.id,
      transactionType: updated.transactionType as
        | 'income'
        | 'expense'
        | 'refund'
        | 'transfer_debit'
        | 'transfer_credit',
      amountMinor: updated.amountMinor.toString(),
      currency: updated.currency,
      amountMadMinor: updated.amountMadMinor.toString(),
      exchangeRate: updated.exchangeRate,
      paymentMethod: updated.paymentMethod,
      transactionDate: updated.transactionDate,
      version: updated.version,
    };
  }

  async archive(
    user: AuthenticatedUser,
    transactionId: string,
    expectedVersion: number,
  ): Promise<{ id: string; archived: true; version: number }> {
    const { db, userId, walletId, row } = await this.authorizedTransaction(
      user,
      transactionId,
      'archive',
    );
    if (row.version !== expectedVersion)
      throw new ConflictException('Transaction version is stale');
    const archivedAt = new Date();
    const retentionUntil = retentionUntilForArchive(archivedAt);
    const updated = await db.transaction(async (tx) => {
      const changed = (
        await tx
          .update(transactionRecords)
          .set({
            archivedAt,
            version: row.version + 1,
            updatedAt: archivedAt,
          })
          .where(
            and(
              eq(transactionRecords.id, transactionId),
              eq(transactionRecords.version, expectedVersion),
              isNull(transactionRecords.archivedAt),
            ),
          )
          .returning()
      )[0];
      if (!changed) return undefined;
      await tx
        .update(transactionAttachments)
        .set({ retentionUntil, updatedAt: archivedAt })
        .where(eq(transactionAttachments.transactionId, transactionId));
      await tx.insert(auditEvents).values({
        id: randomUUID(),
        walletId,
        actorId: userId,
        action: 'transaction.archived',
        entityType: 'transaction',
        entityId: transactionId,
        metadata: {
          previousVersion: expectedVersion,
          newVersion: changed.version,
          attachmentRetentionUntil: retentionUntil.toISOString(),
        },
      });
      return changed;
    });
    if (!updated)
      throw new ConflictException('Transaction is already archived or stale');
    return { id: updated.id, archived: true, version: updated.version };
  }
}
