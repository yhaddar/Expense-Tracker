import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import {
  appUsers,
  auditEvents,
  financialAccounts,
  rolePermissions,
  roles,
  sharedWallets,
  transactionRecords,
  walletMemberships,
  type Database,
} from '@expense-tracker/db';
import {
  defaultMemberPermissions,
  permissions,
  type Permission,
} from '@expense-tracker/domain';
import { Inject } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/oidc.guard';

export type AccountResponse = {
  id: string;
  openingBalanceMinor: string;
  baseCurrency: 'MAD';
};

export type WalletMemberResponse = {
  userId: string;
  subject: string;
  email: string;
  displayName: string;
  roleId: string;
  roleName: string;
  status: string;
};

export type WalletRoleResponse = {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: Permission[];
};

@Injectable()
export class IdentityService {
  constructor(@Inject('DB') private readonly db: Database | null) {}

  private requireDatabase(): Database {
    if (!this.db)
      throw new ServiceUnavailableException('Database is not configured');
    return this.db;
  }

  async requirePermission(
    userId: string,
    walletId: string,
    permission: Permission,
  ): Promise<void> {
    const db = this.requireDatabase();
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
          eq(walletMemberships.status, 'active'),
        ),
      );
    if (!grants.some((grant) => grant.permission === permission))
      throw new ForbiddenException(`Permission required: ${permission}`);
  }

  async provisionUser(
    user: AuthenticatedUser,
  ): Promise<{ userId: string; walletId: string }> {
    const db = this.requireDatabase();
    const existing = await db
      .select({ id: appUsers.id })
      .from(appUsers)
      .where(eq(appUsers.oidcSubject, user.subject))
      .limit(1);
    if (existing[0]) {
      const membership = await db
        .select({
          walletId: walletMemberships.walletId,
          status: walletMemberships.status,
        })
        .from(walletMemberships)
        .where(
          and(
            eq(walletMemberships.userId, existing[0].id),
            eq(walletMemberships.status, 'active'),
          ),
        )
        .limit(1);
      if (!membership[0])
        throw new ConflictException(
          'User has no active Shared Wallet membership',
        );
      return { userId: existing[0].id, walletId: membership[0].walletId };
    }
    const userId = randomUUID();
    const existingWallet = (await db.select().from(sharedWallets).limit(1))[0];
    const walletId = existingWallet?.id ?? randomUUID();
    let roleId: string = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(appUsers).values({
        id: userId,
        oidcSubject: user.subject,
        email: user.email ?? `${user.subject}@local.invalid`,
        displayName: user.email ?? user.subject,
      });
      if (!existingWallet) {
        await tx
          .insert(sharedWallets)
          .values({ id: walletId, name: 'Shared Wallet' });
        await tx
          .insert(roles)
          .values({ id: roleId, walletId, name: 'Admin', isSystem: true });
      } else {
        const memberRole = (
          await tx
            .select({ id: roles.id })
            .from(roles)
            .where(and(eq(roles.walletId, walletId), eq(roles.name, 'Member')))
            .limit(1)
        )[0];
        if (memberRole) {
          roleId = memberRole.id;
        } else {
          await tx
            .insert(roles)
            .values({ id: roleId, walletId, name: 'Member', isSystem: true });
          await tx.insert(rolePermissions).values(
            defaultMemberPermissions.map((permission) => ({
              roleId,
              permission,
            })),
          );
        }
      }
      if (!existingWallet) {
        await tx.insert(rolePermissions).values(
          permissions.map((permission: Permission) => ({
            roleId,
            permission,
          })),
        );
      }
      await tx
        .insert(walletMemberships)
        .values({ walletId, userId, roleId, status: 'active' });
      await tx.insert(auditEvents).values({
        id: randomUUID(),
        walletId,
        actorId: userId,
        action: existingWallet ? 'member.joined' : 'wallet.created',
        entityType: existingWallet ? 'wallet_membership' : 'shared_wallet',
        entityId: existingWallet ? userId : walletId,
        metadata: { roleId },
      });
    });
    return { userId, walletId };
  }

  private async requireWalletManager(user: AuthenticatedUser) {
    const { userId, walletId } = await this.provisionUser(user);
    await this.requirePermission(userId, walletId, 'roles:manage');
    return { userId, walletId };
  }

  private validateRolePermissions(input: unknown): Permission[] {
    if (!Array.isArray(input))
      throw new BadRequestException('permissions must be an array');
    const unique = [...new Set(input)];
    if (
      !unique.every(
        (permission): permission is Permission =>
          typeof permission === 'string' &&
          (permissions as readonly string[]).includes(permission),
      )
    )
      throw new BadRequestException('Role contains an unsupported permission');
    return unique;
  }

  async listMembers(user: AuthenticatedUser): Promise<WalletMemberResponse[]> {
    const { userId, walletId } = await this.requireWalletManager(user);
    const rows = await this.requireDatabase()
      .select({
        userId: appUsers.id,
        subject: appUsers.oidcSubject,
        email: appUsers.email,
        displayName: appUsers.displayName,
        roleId: roles.id,
        roleName: roles.name,
        status: walletMemberships.status,
      })
      .from(walletMemberships)
      .innerJoin(appUsers, eq(walletMemberships.userId, appUsers.id))
      .innerJoin(roles, eq(walletMemberships.roleId, roles.id))
      .where(eq(walletMemberships.walletId, walletId));
    return rows;
  }

  async listRoles(user: AuthenticatedUser): Promise<WalletRoleResponse[]> {
    const { walletId } = await this.requireWalletManager(user);
    const db = this.requireDatabase();
    const roleRows = await db
      .select()
      .from(roles)
      .where(eq(roles.walletId, walletId));
    const permissionRows = roleRows.length
      ? await db
          .select({
            roleId: rolePermissions.roleId,
            permission: rolePermissions.permission,
          })
          .from(rolePermissions)
          .where(
            inArray(
              rolePermissions.roleId,
              roleRows.map((role) => role.id),
            ),
          )
      : [];
    const permissionMap = new Map<string, Permission[]>();
    for (const row of permissionRows) {
      const values = permissionMap.get(row.roleId) ?? [];
      values.push(row.permission as Permission);
      permissionMap.set(row.roleId, values);
    }
    return roleRows.map((role) => ({
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
      permissions: permissionMap.get(role.id) ?? [],
    }));
  }

  async createRole(
    user: AuthenticatedUser,
    input: { name: string; permissions: unknown },
  ): Promise<WalletRoleResponse> {
    const { userId, walletId } = await this.requireWalletManager(user);
    const name = input.name?.trim();
    if (!name || name.length > 80)
      throw new BadRequestException('Role name is invalid');
    const selected = this.validateRolePermissions(input.permissions);
    const id = randomUUID();
    try {
      await this.requireDatabase().transaction(async (tx) => {
        await tx.insert(roles).values({ id, walletId, name, isSystem: false });
        if (selected.length > 0)
          await tx
            .insert(rolePermissions)
            .values(selected.map((permission) => ({ roleId: id, permission })));
        await tx.insert(auditEvents).values({
          id: randomUUID(),
          walletId,
          actorId: userId,
          action: 'role.created',
          entityType: 'role',
          entityId: id,
          metadata: { permissions: selected },
        });
      });
    } catch (error) {
      const databaseError = error as { cause?: { code?: string } };
      if (databaseError.cause?.code === '23505')
        throw new ConflictException('A role with this name already exists');
      throw error;
    }
    return { id, name, isSystem: false, permissions: selected };
  }

  async assignRole(user: AuthenticatedUser, memberId: string, roleId: string) {
    const { userId, walletId } = await this.requireWalletManager(user);
    if (memberId === userId)
      throw new ConflictException(
        'The active administrator cannot change their own role',
      );
    const role = (
      await this.requireDatabase()
        .select()
        .from(roles)
        .where(and(eq(roles.id, roleId), eq(roles.walletId, walletId)))
        .limit(1)
    )[0];
    if (!role) throw new NotFoundException('Role not found');
    const member = (
      await this.requireDatabase()
        .select()
        .from(walletMemberships)
        .where(
          and(
            eq(walletMemberships.userId, memberId),
            eq(walletMemberships.walletId, walletId),
          ),
        )
        .limit(1)
    )[0];
    if (!member) throw new NotFoundException('Member not found');
    const updated = await this.requireDatabase().transaction(async (tx) => {
      const changed = (
        await tx
          .update(walletMemberships)
          .set({ roleId, status: 'active' })
          .where(
            and(
              eq(walletMemberships.userId, memberId),
              eq(walletMemberships.walletId, walletId),
            ),
          )
          .returning()
      )[0];
      await tx.insert(auditEvents).values({
        id: randomUUID(),
        walletId,
        actorId: userId,
        action: 'member.role_changed',
        entityType: 'wallet_membership',
        entityId: memberId,
        metadata: { roleId },
      });
      return changed;
    });
    return {
      userId: memberId,
      roleId: updated?.roleId ?? roleId,
      status: 'active' as const,
    };
  }

  async revokeMember(user: AuthenticatedUser, memberId: string) {
    const { userId, walletId } = await this.requireWalletManager(user);
    if (memberId === userId)
      throw new ConflictException(
        'The active administrator cannot revoke their own membership',
      );
    const updated = await this.requireDatabase().transaction(async (tx) => {
      const changed = (
        await tx
          .update(walletMemberships)
          .set({ status: 'revoked' })
          .where(
            and(
              eq(walletMemberships.userId, memberId),
              eq(walletMemberships.walletId, walletId),
              eq(walletMemberships.status, 'active'),
            ),
          )
          .returning()
      )[0];
      if (!changed) return undefined;
      await tx.insert(auditEvents).values({
        id: randomUUID(),
        walletId,
        actorId: userId,
        action: 'member.revoked',
        entityType: 'wallet_membership',
        entityId: memberId,
        metadata: {},
      });
      return changed;
    });
    if (!updated) throw new NotFoundException('Active member not found');
    return { userId: memberId, status: 'revoked' as const };
  }

  async createAccount(
    user: AuthenticatedUser,
    openingBalanceMinor: string,
  ): Promise<AccountResponse> {
    const db = this.requireDatabase();
    if (!/^-?\d+$/.test(openingBalanceMinor))
      throw new BadRequestException(
        'Opening balance must be an integer minor-unit value',
      );
    const { userId } = await this.provisionUser(user);
    const id = randomUUID();
    try {
      const rows = await db
        .insert(financialAccounts)
        .values({
          id,
          userId,
          openingBalanceMinor: BigInt(openingBalanceMinor),
          baseCurrency: 'MAD',
        })
        .returning();
      const account = rows[0];
      if (!account) throw new Error('Account insert returned no row');
      return {
        id: account.id,
        openingBalanceMinor: account.openingBalanceMinor.toString(),
        baseCurrency: 'MAD',
      };
    } catch (error) {
      const databaseError = error as {
        cause?: { code?: string; constraint_name?: string };
      };
      if (
        databaseError.cause?.code === '23505' &&
        databaseError.cause.constraint_name === 'financial_accounts_user_id_key'
      )
        throw new ConflictException(
          'A financial account already exists for this user',
        );
      throw error;
    }
  }

  async getAccount(user: AuthenticatedUser): Promise<AccountResponse | null> {
    const db = this.requireDatabase();
    const { userId } = await this.provisionUser(user);
    const rows = await db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.userId, userId))
      .limit(1);
    const account = rows[0];
    return account
      ? {
          id: account.id,
          openingBalanceMinor: account.openingBalanceMinor.toString(),
          baseCurrency: 'MAD',
        }
      : null;
  }

  async getBalance(user: AuthenticatedUser): Promise<{
    openingBalanceMinor: string;
    balanceMinor: string;
    baseCurrency: 'MAD';
  }> {
    const db = this.requireDatabase();
    const { userId } = await this.provisionUser(user);
    const account = (
      await db
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.userId, userId))
        .limit(1)
    )[0];
    if (!account)
      throw new ConflictException('Financial account setup is required');
    const activity = await db
      .select({
        transactionType: transactionRecords.transactionType,
        amountMadMinor: transactionRecords.amountMadMinor,
      })
      .from(transactionRecords)
      .where(
        and(
          eq(transactionRecords.accountId, account.id),
          isNull(transactionRecords.archivedAt),
        ),
      );
    const balance = activity.reduce(
      (value, row) =>
        value +
        (row.transactionType === 'income' ||
        row.transactionType === 'refund' ||
        row.transactionType === 'transfer_credit'
          ? row.amountMadMinor
          : -row.amountMadMinor),
      account.openingBalanceMinor,
    );
    return {
      openingBalanceMinor: account.openingBalanceMinor.toString(),
      balanceMinor: balance.toString(),
      baseCurrency: 'MAD',
    };
  }
}
