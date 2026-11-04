export const permissions = [
  'wallet:read',
  'transactions:read',
  'transactions:create',
  'transactions:edit:any',
  'transactions:archive:any',
  'transactions:edit:own',
  'transactions:archive:own',
  'attachments:read',
  'budgets:read',
  'budgets:manage',
  'reports:read',
  'members:manage',
  'roles:manage',
  'categories:manage',
  'account:manage',
  'audit:read',
] as const;

export type Permission = (typeof permissions)[number];
export type Role = 'admin' | 'member' | 'custom';

/** The least-privilege role assigned to users joining an existing wallet. */
export const defaultMemberPermissions = [
  'wallet:read',
  'transactions:read',
  'transactions:create',
  'transactions:edit:own',
  'transactions:archive:own',
  'attachments:read',
  'budgets:read',
  'reports:read',
] as const satisfies readonly Permission[];

export type AuthorizationSubject = {
  userId: string;
  role: Role;
  permissions: ReadonlySet<Permission>;
};

export function hasPermission(
  subject: AuthorizationSubject,
  permission: Permission,
): boolean {
  return subject.role === 'admin' || subject.permissions.has(permission);
}

export function canMutateTransaction(
  subject: AuthorizationSubject,
  creatorId: string,
  action: 'edit' | 'archive',
): boolean {
  const anyPermission = `transactions:${action}:any` as Permission;
  const ownPermission = `transactions:${action}:own` as Permission;
  return (
    hasPermission(subject, anyPermission) ||
    (subject.userId === creatorId && hasPermission(subject, ownPermission))
  );
}
