import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, test } from 'node:test';
import { AuthError, ROLES, createAuth, createDatabaseFile, databasePath } from '../src/index.ts';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'login-sdk-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

test('primeira chamada cria o arquivo e as tabelas', async () => {
  const file = join(dir, 'nested', 'auth.sqlite');
  const auth = createAuth({ file });

  assert.equal(existsSync(file), false);

  const user = await auth.register({
    email: 'Ana@Curso.dev',
    password: 'senha-do-exemplo',
  });

  assert.equal(existsSync(file), true);
  assert.equal(user.email, 'ana@curso.dev');

  const db = new DatabaseSync(file);
  const tables = (db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'sessions')")
    .all() as Array<{ name: string }>)
    .map((row) => row.name)
    .sort();
  const stored = db.prepare('SELECT password_hash FROM users').get() as { password_hash: string } | undefined;
  db.close();

  assert.deepEqual(tables, ['sessions', 'users']);
  assert.ok(stored);
  assert.notEqual(stored.password_hash, 'senha-do-exemplo');
  assert.match(stored.password_hash, /^scrypt\$/);
});

test('login, me e logout', async () => {
  const auth = createAuth({ file: join(dir, 'auth.sqlite') });
  await auth.register({ email: 'ana@curso.dev', password: 'senha-do-exemplo' });

  const session = await auth.login({
    email: 'ana@curso.dev',
    password: 'senha-do-exemplo',
  });

  assert.equal(typeof session.token, 'string');
  assert.equal(session.user.email, 'ana@curso.dev');
  assert.deepEqual(auth.me(session.token), session.user);

  auth.logout(session.token);
  assert.equal(auth.me(session.token), null);
});

test('cadastro grava papel e login devolve as permissões', async () => {
  const auth = createAuth({ file: join(dir, 'auth.sqlite') });

  const admin = await auth.register({
    email: 'admin@curso.dev',
    password: 'senha-do-exemplo',
    role: 'adm',
  });
  assert.equal(admin.role, 'ADM');
  assert.deepEqual(admin.permissions, [
    'users:read',
    'users:write',
    'content:moderate',
    'content:write',
    'content:read',
  ]);

  const guest = await auth.register({
    email: 'visita@curso.dev',
    password: 'senha-do-exemplo',
    role: 'GUEST',
  });
  const session = await auth.login({
    email: 'visita@curso.dev',
    password: 'senha-do-exemplo',
  });

  assert.equal(guest.role, 'GUEST');
  assert.deepEqual(session.user, guest);
  assert.equal(auth.can(session.token, 'content:read'), true);
  assert.equal(auth.can(session.token, 'content:write'), false);
  assert.deepEqual(ROLES, ['ADM', 'MOD', 'USER', 'GUEST']);

  await assert.rejects(
    () => auth.register({ email: 'outro@curso.dev', password: 'senha-do-exemplo', role: 'root' }),
    (error) => error instanceof AuthError && error.code === 'INVALID_INPUT',
  );
});

test('banco antigo ganha a coluna role', async () => {
  const file = join(dir, 'auth.sqlite');
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  db.close();

  const auth = createAuth({ file });
  const user = await auth.register({ email: 'ana@curso.dev', password: 'senha-do-exemplo' });
  assert.equal(user.role, 'USER');
  assert.deepEqual(user.permissions, ['content:write', 'content:read']);
});

test('rejeita e-mail repetido e senha errada', async () => {
  const auth = createAuth({ file: join(dir, 'auth.sqlite') });
  await auth.register({ email: 'ana@curso.dev', password: 'senha-do-exemplo' });

  await assert.rejects(
    () => auth.register({ email: 'ana@curso.dev', password: 'outra-senha-123' }),
    (error) => error instanceof AuthError && error.code === 'EMAIL_IN_USE',
  );

  await assert.rejects(
    () => auth.login({ email: 'ana@curso.dev', password: 'senha-errada' }),
    (error) => error instanceof AuthError && error.code === 'INVALID_CREDENTIALS',
  );

  await assert.rejects(
    () => auth.login({ email: 'ninguem@curso.dev', password: 'senha-do-exemplo' }),
    (error) => error instanceof AuthError && error.code === 'INVALID_CREDENTIALS',
  );
});

test('createDatabaseFile cria o arquivo dentro da SDK', () => {
  assert.match(databasePath, /packages\/login-sdk\/data\/auth\.sqlite$/);

  const file = join(dir, 'data', 'auth.sqlite');
  assert.equal(existsSync(file), false);

  const created = createDatabaseFile(file);
  assert.equal(created, resolve(file));
  assert.equal(existsSync(file), true);

  const db = new DatabaseSync(file);
  const tables = (db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'sessions')")
    .all() as Array<{ name: string }>)
    .map((row) => row.name)
    .sort();
  const users = db.prepare('SELECT COUNT(*) AS total FROM users').get() as { total: number };
  db.close();

  assert.deepEqual(tables, ['sessions', 'users']);
  assert.equal(users.total, 0);
});
