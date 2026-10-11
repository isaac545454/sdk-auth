import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const SCHEMA = readFileSync(new URL('../sql/schema.sql', import.meta.url), 'utf8');

/** Arquivo SQLite que nasce dentro deste pacote. */
export const databasePath = fileURLToPath(new URL('../data/auth.sqlite', import.meta.url));

/** Abre o arquivo SQLite e cria as tabelas se ainda não existirem. */
export function openDatabase(file: string): DatabaseSync {
  const path = resolve(file);
  mkdirSync(dirname(path), { recursive: true });

  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  ensureRoleColumn(db);
  return db;
}

/** Banco criado antes da coluna `role` ganha o papel `USER` nas contas que já existem. */
function ensureRoleColumn(db: DatabaseSync): void {
  const columns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  if (columns.some((column) => column.name === 'role')) return;
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER'");
}

/** Cria o arquivo e as tabelas, sem cadastrar usuário. Devolve o caminho absoluto. */
export function createDatabaseFile(file: string = databasePath): string {
  const db = openDatabase(file);
  db.close();
  return resolve(file);
}
