import { randomBytes, randomUUID } from 'node:crypto';
import { databasePath, openDatabase } from './db.ts';
import { AuthError } from './errors.ts';
import { hashPassword, verifyPassword } from './password.ts';
import { normalizeRole, publicUser } from './roles.ts';
import type { Auth, AuthPermission, AuthSession, AuthUser, CreateAuthOptions } from './types.ts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SQLITE_CONSTRAINT_UNIQUE = 2067;

interface SessionRow {
  id: string;
  email: string;
  role: string;
}

interface LoginRow extends SessionRow {
  password_hash: string;
}

interface CredentialFields {
  email?: unknown;
  password?: unknown;
  role?: unknown;
}

export function createAuth(options: CreateAuthOptions = {}): Auth {
  const file = options.file ?? databasePath;
  if (typeof file !== 'string' || file.length === 0) {
    throw new AuthError('INVALID_INPUT', 'Informe o caminho do arquivo SQLite.');
  }

  let db: ReturnType<typeof openDatabase> | undefined;

  function database() {
    if (!db) db = openDatabase(file);
    return db;
  }

  function normalizeEmail(email: unknown): string {
    if (typeof email !== 'string' || !EMAIL.test(email.trim())) {
      throw new AuthError('INVALID_INPUT', 'Use um e-mail válido, como nome@empresa.com.');
    }
    return email.trim().toLowerCase();
  }

  function assertPassword(password: unknown): string {
    if (typeof password !== 'string' || password.length < 8) {
      throw new AuthError('INVALID_INPUT', 'A senha precisa ter pelo menos 8 caracteres.');
    }
    return password;
  }

  function readFields(input: unknown): CredentialFields {
    if (!input || typeof input !== 'object') {
      throw new AuthError('INVALID_INPUT', 'Informe e-mail e senha para continuar.');
    }
    return input as CredentialFields;
  }

  function sessionUser(token: unknown): AuthUser | null {
    if (typeof token !== 'string' || token.length === 0) return null;

    const row = database()
      .prepare(
        `SELECT users.id AS id, users.email AS email, users.role AS role
         FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.token = ?`,
      )
      .get(token) as SessionRow | undefined;

    if (!row) return null;
    return publicUser(row);
  }

  return {
    async register(input: unknown): Promise<AuthUser> {
      const fields = readFields(input);
      const email = normalizeEmail(fields.email);
      const password = assertPassword(fields.password);
      const role = normalizeRole(fields.role);
      const passwordHash = await hashPassword(password);
      const user = {
        id: randomUUID(),
        email,
        role,
        createdAt: new Date().toISOString(),
      };

      try {
        database()
          .prepare(
            'INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
          )
          .run(user.id, user.email, passwordHash, user.role, user.createdAt);
      } catch (error) {
        if (isUniqueEmail(error)) {
          throw new AuthError('EMAIL_IN_USE', 'Esse e-mail já está cadastrado. Entre com ele ou use outro.');
        }
        throw error;
      }

      return publicUser(user);
    },

    async login(input: unknown): Promise<AuthSession> {
      const fields = readFields(input);
      const email = normalizeEmail(fields.email);
      const password = assertPassword(fields.password);
      const row = database()
        .prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?')
        .get(email) as LoginRow | undefined;

      const matches = row ? await verifyPassword(password, row.password_hash) : false;
      if (!row || !matches) {
        throw new AuthError('INVALID_CREDENTIALS', 'E-mail ou senha incorretos. Confira os dados e tente de novo.');
      }

      const token = randomBytes(32).toString('base64url');
      database()
        .prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)')
        .run(token, row.id, new Date().toISOString());

      return {
        token,
        user: publicUser(row),
      };
    },

    me(token: string): AuthUser | null {
      return sessionUser(token);
    },

    can(token: string, permission: AuthPermission): boolean {
      const user = sessionUser(token);
      if (!user) return false;
      return user.permissions.includes(permission);
    },

    logout(token: string): void {
      if (typeof token !== 'string' || token.length === 0) return;
      database().prepare('DELETE FROM sessions WHERE token = ?').run(token);
    },
  };
}

function isUniqueEmail(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errcode' in error &&
    error.errcode === SQLITE_CONSTRAINT_UNIQUE
  );
}
