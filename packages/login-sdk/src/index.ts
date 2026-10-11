export { createAuth } from './create-auth.ts';
export { createDatabaseFile, databasePath } from './db.ts';
export { AuthError } from './errors.ts';
export type { AuthErrorCode } from './errors.ts';
export { ROLES } from './roles.ts';
export type {
  Auth,
  AuthPermission,
  AuthRole,
  AuthSession,
  AuthUser,
  CreateAuthOptions,
  LoginInput,
  RegisterInput,
} from './types.ts';
