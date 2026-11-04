import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, gte, isNull, lt } from 'drizzle-orm';
import {
  budgets,
  notifications,
  transactionRecords,
  type Database,
} from '@expense-tracker/db';
import type { AuthenticatedUser } from '../auth/oidc.guard';
import { IdentityService } from '../identity/identity.service';

type BudgetInput = {
  monthStart: string;
  limitMadMinor: string;
  categoryId?: string;
  thresholdPercent?: number;
};

function nextMonth(monthStart: string): string {
  const date = new Date(`${monthStart}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class BudgetService {
  constructor(
    @Inject('DB') private readonly db: Database | null,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  private database(): Database {
    if (!this.db)
      throw new ServiceUnavailableException('Database is not configured');
    return this.db;
  }

  async create(user: AuthenticatedUser, input: BudgetInput) {
    const db = this.database();
    if (
      !/^\d{4}-\d{2}-01$/.test(input.monthStart) ||
      !/^\d+$/.test(input.limitMadMinor) ||
      BigInt(input.limitMadMinor) <= 0n ||
      (input.thresholdPercent !== undefined &&
        (input.thresholdPercent < 1 || input.thresholdPercent > 100))
    )
      throw new BadRequestException('Budget month and limit are invalid');
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(userId, walletId, 'budgets:manage');
    const budgetScopeKey = input.categoryId ?? 'global';
    const id = randomUUID();
    const row = (
      await db
        .insert(budgets)
        .values({
          id,
          walletId,
          budgetScopeKey,
          categoryId: input.categoryId ?? null,
          monthStart: input.monthStart,
          limitMadMinor: BigInt(input.limitMadMinor),
          thresholdPercent: input.thresholdPercent ?? 80,
        })
        .onConflictDoUpdate({
          target: [
            budgets.walletId,
            budgets.budgetScopeKey,
            budgets.monthStart,
          ],
          set: {
            limitMadMinor: BigInt(input.limitMadMinor),
            thresholdPercent: input.thresholdPercent ?? 80,
            updatedAt: new Date(),
          },
        })
        .returning()
    )[0];
    if (!row) throw new Error('Budget write returned no row');
    return {
      id: row.id,
      monthStart: row.monthStart,
      budgetScopeKey: row.budgetScopeKey,
      limitMadMinor: row.limitMadMinor.toString(),
      currentMadMinor: row.currentMadMinor.toString(),
      thresholdState: row.thresholdState,
    };
  }

  async evaluate(user: AuthenticatedUser, budgetId: string) {
    const db = this.database();
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(userId, walletId, 'budgets:manage');
    const budget = (
      await db
        .select()
        .from(budgets)
        .where(and(eq(budgets.id, budgetId), eq(budgets.walletId, walletId)))
        .limit(1)
    )[0];
    if (!budget) throw new ConflictException('Budget not found');
    const activity = await db
      .select({
        transactionType: transactionRecords.transactionType,
        amountMadMinor: transactionRecords.amountMadMinor,
      })
      .from(transactionRecords)
      .where(
        and(
          eq(transactionRecords.walletId, walletId),
          isNull(transactionRecords.archivedAt),
          gte(transactionRecords.transactionDate, budget.monthStart),
          lt(transactionRecords.transactionDate, nextMonth(budget.monthStart)),
          ...(budget.categoryId
            ? [eq(transactionRecords.categoryId, budget.categoryId)]
            : []),
        ),
      );
    const netCurrent = activity.reduce(
      (sum, row) =>
        sum +
        (row.transactionType === 'expense'
          ? row.amountMadMinor
          : row.transactionType === 'refund'
            ? -row.amountMadMinor
            : 0n),
      0n,
    );
    const current = netCurrent < 0n ? 0n : netCurrent;
    const threshold =
      current >= budget.limitMadMinor
        ? 'exceeded'
        : current * 100n >=
            budget.limitMadMinor * BigInt(budget.thresholdPercent)
          ? 'attention'
          : 'normal';
    const updated = (
      await db
        .update(budgets)
        .set({
          currentMadMinor: current,
          thresholdState: threshold,
          updatedAt: new Date(),
        })
        .where(eq(budgets.id, budget.id))
        .returning()
    )[0];
    if (!updated) throw new Error('Budget update returned no row');
    if (threshold !== 'normal' && threshold !== budget.thresholdState)
      await db
        .insert(notifications)
        .values({
          id: randomUUID(),
          walletId,
          userId,
          eventType: 'budget.threshold',
          title:
            threshold === 'exceeded'
              ? 'Budget exceeded'
              : 'Budget threshold reached',
          body: `${budget.budgetScopeKey} budget is at ${current.toString()} MAD minor units`,
          entityId: budget.id,
        })
        .onConflictDoNothing();
    return {
      id: updated.id,
      currentMadMinor: current.toString(),
      limitMadMinor: updated.limitMadMinor.toString(),
      thresholdState: threshold,
    };
  }

  async list(user: AuthenticatedUser) {
    const db = this.database();
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(userId, walletId, 'budgets:read');
    return (
      await db.select().from(budgets).where(eq(budgets.walletId, walletId))
    ).map((row) => ({
      id: row.id,
      monthStart: row.monthStart,
      budgetScopeKey: row.budgetScopeKey,
      limitMadMinor: row.limitMadMinor.toString(),
      currentMadMinor: row.currentMadMinor.toString(),
      thresholdState: row.thresholdState,
    }));
  }

  async notificationsFor(user: AuthenticatedUser) {
    const db = this.database();
    const { userId, walletId } = await this.identity.provisionUser(user);
    await this.identity.requirePermission(userId, walletId, 'wallet:read');
    return (
      await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
    ).map((row) => ({
      id: row.id,
      eventType: row.eventType,
      title: row.title,
      body: row.body,
      read: Boolean(row.readAt),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async markNotificationRead(user: AuthenticatedUser, notificationId: string) {
    const db = this.database();
    const { userId } = await this.identity.provisionUser(user);
    const row = (
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId),
          ),
        )
        .returning({ id: notifications.id, readAt: notifications.readAt })
    )[0];
    if (!row) throw new ConflictException('Notification not found');
    return { id: row.id, read: Boolean(row.readAt) };
  }
}
