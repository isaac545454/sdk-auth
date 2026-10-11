import { AuthError } from './errors.ts';
import type { AuthPermission, AuthRole, AuthUser } from './types.ts';

/** Papéis aceitos no cadastro. Sem `role`, a conta nasce `USER`. */
export const ROLES = ['ADM', 'MOD', 'USER', 'GUEST'] as const satisfies readonly AuthRole[];

/** O que cada papel pode fazer. O login devolve essa lista junto com o papel. */
const ROLE_PERMISSIONS = {
  ADM: ['users:read', 'users:write', 'content:moderate', 'content:write', 'content:read'],
  MOD: ['content:moderate', 'content:write', 'content:read'],
  USER: ['content:write', 'content:read'],
  GUEST: ['content:read'],
} as const satisfies Record<AuthRole, readonly AuthPermission[]>;

const ROLE_LIST: readonly string[] = ROLES;

/**
 * Sem papel, ou papel vazio, a conta nasce `USER`.
 * `adm` e `Adm` viram `ADM`.
 */
export function normalizeRole(role: unknown): AuthRole {
  if (role == null || role === '') return 'USER';
  if (typeof role !== 'string') {
    throw new AuthError('INVALID_INPUT', 'Escolha uma permissão: administrador, moderador, usuário ou convidado.');
  }

  const value = role.trim().toUpperCase();
  if (!ROLE_LIST.includes(value)) {
    throw new AuthError('INVALID_INPUT', 'Escolha uma permissão: administrador, moderador, usuário ou convidado.');
  }
  return value as AuthRole;
}

export function permissionsFor(role: AuthRole): AuthPermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function publicUser(row: { id: string; email: string; role: string }): AuthUser {
  const role = normalizeRole(row.role);
  return {
    id: row.id,
    email: row.email,
    role,
    permissions: permissionsFor(role),
  };
}
