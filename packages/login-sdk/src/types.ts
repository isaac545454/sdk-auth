/** Papel gravado na conta. Sem `role` no cadastro, vale `USER`. */
export type AuthRole = 'ADM' | 'MOD' | 'USER' | 'GUEST';

export type AuthPermission =
  | 'users:read'
  | 'users:write'
  | 'content:moderate'
  | 'content:write'
  | 'content:read';

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
  permissions: AuthPermission[];
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface CreateAuthOptions {
  /** Caminho do arquivo SQLite. Padrão: `data/auth.sqlite` dentro deste pacote. */
  file?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  role?: AuthRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Auth {
  register(input: unknown): Promise<AuthUser>;
  login(input: unknown): Promise<AuthSession>;
  me(token: string): AuthUser | null;
  /** `true` quando a sessão existe e o papel inclui essa permissão. */
  can(token: string, permission: AuthPermission): boolean;
  logout(token: string): void;
}
