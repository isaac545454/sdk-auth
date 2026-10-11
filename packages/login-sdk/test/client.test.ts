import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, createSessionClient, type FetchLike, type TokenStorage } from '../src/client.ts';

function memoryStorage(): TokenStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function fakeFetch(routes: Record<string, { status: number; body?: unknown }>): FetchLike {
  return async (url, init = {}) => {
    const route = routes[`${init.method ?? 'GET'} ${url}`];
    if (!route) throw new Error(`sem rota ${init.method ?? 'GET'} ${url}`);
    return {
      status: route.status,
      ok: route.status >= 200 && route.status < 300,
      json: async () => route.body ?? {},
    };
  };
}

test('sem token a sessão fica deslogada', async () => {
  const client = createSessionClient({
    storage: memoryStorage(),
    fetchImpl: fakeFetch({}),
  });

  assert.equal(client.readToken(), null);
  assert.deepEqual(await client.load(), {
    session: null,
    status: 'unauthenticated',
  });
});

test('login grava o token e me devolve o usuário', async () => {
  const storage = memoryStorage();
  const client = createSessionClient({
    storage,
    fetchImpl: fakeFetch({
      'POST /api/login': {
        status: 200,
        body: {
          token: 'abc',
          user: {
            id: '1',
            email: 'ana@curso.dev',
            role: 'USER',
            permissions: ['content:write', 'content:read'],
          },
        },
      },
      'GET /api/me': {
        status: 200,
        body: {
          id: '1',
          email: 'ana@curso.dev',
          role: 'USER',
          permissions: ['content:write', 'content:read'],
        },
      },
    }),
  });

  const signed = await client.signIn({
    email: 'ana@curso.dev',
    password: 'senha-do-exemplo',
  });

  assert.equal(client.readToken(), 'abc');
  assert.equal(signed.status, 'authenticated');
  assert.equal(signed.session.user.email, 'ana@curso.dev');
  assert.equal(signed.session.user.role, 'USER');
  assert.deepEqual(await client.load(), signed);
});

test('token inválido limpa a sessão', async () => {
  const storage = memoryStorage();
  storage.setItem('curso.token', 'velho');
  const client = createSessionClient({
    storage,
    fetchImpl: fakeFetch({
      'GET /api/me': {
        status: 401,
        body: { code: 'INVALID_CREDENTIALS', message: 'Sessão inválida.' },
      },
    }),
  });

  assert.deepEqual(await client.load(), {
    session: null,
    status: 'unauthenticated',
  });
  assert.equal(client.readToken(), null);
});

test('logout apaga o token mesmo se a API falhar', async () => {
  const storage = memoryStorage();
  storage.setItem('curso.token', 'abc');
  const client = createSessionClient({
    storage,
    fetchImpl: async () => {
      throw new Error('rede');
    },
  });

  await assert.rejects(() => client.signOut(), /rede/);
  assert.equal(client.readToken(), null);
});

test('register devolve o erro da API', async () => {
  const client = createSessionClient({
    storage: memoryStorage(),
    fetchImpl: fakeFetch({
      'POST /api/register': {
        status: 409,
        body: { code: 'EMAIL_IN_USE', message: 'Esse e-mail já tem conta.' },
      },
    }),
  });

  await assert.rejects(
    () => client.register({ email: 'ana@curso.dev', password: 'senha-do-exemplo' }),
    (error) => error instanceof ApiError && error.code === 'EMAIL_IN_USE' && error.message === 'Esse e-mail já tem conta.',
  );
});
