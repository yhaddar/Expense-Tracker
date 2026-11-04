import { createHash, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, lte } from 'drizzle-orm';
import {
  auditEvents,
  financialAccounts,
  idempotencyKeys,
  recurringTemplates,
  transactionRecords,
  type Database,
} from '@expense-tracker/db';
import type { AuthenticatedUser } from '../auth/oidc.guard';
import { IdentityService } from '../identity/identity.service';
import type {
  CreateTransactionInput,
  TransactionResponse,
} from './ledger.service';
import { isValidMoroccoDate, validateTransactionInput } from './ledger.service';

function response(
  row: typeof transactionRecords.$inferSelect,
): TransactionResponse {
  return {
    id: row.id,
    transactionType: row.transactionType as 'income' | 'expense' | 'refund',
    amountMinor: row.amountMinor.toString(),
    currency: row.currency,
    amountMadMinor: row.amountMadMinor.toString(),
    exchangeRate: row.exchangeRate,
    paymentMethod: row.paymentMethod,
    transactionDate: row.transactionDate,
    version: row.version,
  };
}

function nextDate(
  date: string,
  frequency: 'daily' | 'weekly' | 'monthly',
): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  if (frequency === 'daily') value.setUTCDate(value.getUTCDate() + 1);
  else if (frequency === 'weekly') value.setUTCDate(value.getUTCDate() + 7);
  else value.setUTCMonth(value.getUTCMonth() + 1);
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class RefundRecurringService {
  constructor(
    @Inject('DB') private readonly db: Database | null,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  private database(): Database {
    if (!this.db)
      throw new ServiceUnavailableException('Database is not configured');
    return this.db;
  }

  async refund(
    user: AuthenticatedUser,
    originalId: string,
    input: Pick<
      CreateTransactionInput,
      | 'amountMinor'
      | 'amountMadMinor'
      | 'transactionDate'
      | 'paymentMethod'
      | 'note'
    >,
    operationKey: string | undefined,
  ): Promise<TransactionResponse> {
    if (!operationKey)
      throw new ConflictException('Idempotency-Key is required');
    const db = this.database();
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(
      userId,
      walletId,
      'transactions:create',
    );
    const original = (
      await db
        .select()
        .from(transactionRecords)
        .where(
          and(
            eq(transactionRecords.id, originalId),
            eq(transactionRecords.walletId, walletId),
          ),
        )
        .limit(1)
    )[0];
    if (!original || original.transactionType !== 'expense')
      throw new ConflictException('Only an existing expense can be refunded');
    if (!/^\d+$/.test(input.amountMinor) || !/^\d+$/.test(input.amountMadMinor))
      throw new BadRequestException(
        'Refund amounts must be positive integer minor-unit values',
      );
    const amountMinor = BigInt(input.amountMinor);
    const amountMad = BigInt(input.amountMadMinor);
    if (amountMinor <= 0n || amountMad <= 0n)
      throw new BadRequestException('Refund must be positive');
    if (!isValidMoroccoDate(input.transactionDate))
      throw new BadRequestException(
        'Refund date must be a valid Morocco UTC date',
      );
    const requestHash = createHash('sha256')
      .update(JSON.stringify({ originalId, input }))
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
        return existing[0].responseBody as TransactionResponse;
      }
      const alreadyRefunded = (
        await tx
          .select({ amountMadMinor: transactionRecords.amountMadMinor })
          .from(transactionRecords)
          .where(eq(transactionRecords.originalTransactionId, originalId))
      ).reduce((sum, row) => sum + row.amountMadMinor, 0n);
      if (alreadyRefunded + amountMad > original.amountMadMinor)
        throw new ConflictException(
          'Refund exceeds the remaining refundable amount',
        );
      const id = randomUUID();
      const rows = await tx
        .insert(transactionRecords)
        .values({
          id,
          walletId,
          accountId: original.accountId,
          creatorId: userId,
          originalTransactionId: originalId,
          transactionType: 'refund',
          amountMinor: BigInt(input.amountMinor),
          currency: original.currency,
          amountMadMinor: amountMad,
          exchangeRate: original.exchangeRate,
          rateTimestamp: original.rateTimestamp,
          rateSource: original.rateSource,
          paymentMethod: input.paymentMethod,
          transactionDate: input.transactionDate,
          note: input.note ?? null,
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error('Refund insert returned no row');
      await tx.insert(auditEvents).values({
        id: randomUUID(),
        walletId,
        actorId: userId,
        action: 'refund.created',
        entityType: 'transaction',
        entityId: id,
        metadata: {
          originalTransactionId: originalId,
          amountMadMinor: input.amountMadMinor,
        },
      });
      const result = response(row);
      await tx.insert(idempotencyKeys).values({
        userId,
        operationKey,
        requestHash,
        responseStatus: 201,
        responseBody: result,
      });
      return result;
    });
  }

  async createRecurring(
    user: AuthenticatedUser,
    input: CreateTransactionInput & {
      frequency: 'daily' | 'weekly' | 'monthly';
    },
  ): Promise<{ id: string; nextOccurrenceDate: string }> {
    validateTransactionInput(input);
    if (!['daily', 'weekly', 'monthly'].includes(input.frequency))
      throw new BadRequestException('Recurring frequency is invalid');
    const db = this.database();
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(
      userId,
      walletId,
      'transactions:create',
    );
    const account = (
      await db
        .select({ id: financialAccounts.id })
        .from(financialAccounts)
        .where(eq(financialAccounts.userId, userId))
        .limit(1)
    )[0];
    if (!account)
      throw new ConflictException('Financial account setup is required');
    const id = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(recurringTemplates).values({
        id,
        walletId,
        accountId: account.id,
        creatorId: userId,
        transactionType: input.transactionType,
        amountMinor: BigInt(input.amountMinor),
        currency: input.currency,
        amountMadMinor: BigInt(input.amountMadMinor),
        exchangeRate: input.exchangeRate,
        paymentMethod: input.paymentMethod,
        frequency: input.frequency,
        nextOccurrenceDate: input.transactionDate,
        status: 'active',
      });
      await tx.insert(auditEvents).values({
        id: randomUUID(),
        walletId,
        actorId: userId,
        action: 'recurring.created',
        entityType: 'recurring_template',
        entityId: id,
        metadata: {
          frequency: input.frequency,
          nextOccurrenceDate: input.transactionDate,
        },
      });
    });
    return { id, nextOccurrenceDate: input.transactionDate };
  }

  async generate(
    user: AuthenticatedUser,
    asOfDate: string,
  ): Promise<TransactionResponse[]> {
    if (!isValidMoroccoDate(asOfDate))
      throw new BadRequestException(
        'Generation date must be a valid Morocco UTC date',
      );
    const db = this.database();
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(
      userId,
      walletId,
      'transactions:create',
    );
    const templates = await db
      .select()
      .from(recurringTemplates)
      .where(
        and(
          eq(recurringTemplates.walletId, walletId),
          eq(recurringTemplates.status, 'active'),
          lte(recurringTemplates.nextOccurrenceDate, asOfDate),
        ),
      );
    const generated: TransactionResponse[] = [];
    for (const template of templates) {
      await db.transaction(async (tx) => {
        const rows = await tx
          .insert(transactionRecords)
          .values({
            id: randomUUID(),
            walletId,
            accountId: template.accountId,
            creatorId: userId,
            recurringTemplateId: template.id,
            transactionType: template.transactionType,
            amountMinor: template.amountMinor,
            currency: template.currency,
            amountMadMinor: template.amountMadMinor,
            exchangeRate: template.exchangeRate,
            rateTimestamp: null,
            rateSource: 'recurring-snapshot',
            paymentMethod: template.paymentMethod,
            transactionDate: template.nextOccurrenceDate,
            note: 'Generated recurring transaction',
          })
          .onConflictDoNothing({
            target: [
              transactionRecords.recurringTemplateId,
              transactionRecords.transactionDate,
            ],
          })
          .returning();
        if (rows[0]) generated.push(response(rows[0]));
        await tx
          .update(recurringTemplates)
          .set({
            nextOccurrenceDate: nextDate(
              template.nextOccurrenceDate,
              template.frequency as 'daily' | 'weekly' | 'monthly',
            ),
            updatedAt: new Date(),
            version: template.version + 1,
          })
          .where(eq(recurringTemplates.id, template.id));
      });
    }
    return generated;
  }
}
