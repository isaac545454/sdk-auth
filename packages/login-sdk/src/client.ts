import type { AuthUser, LoginInput, RegisterInput } from './types.ts';

const TOKEN_KEY = 'curso.token';

export interface TokenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface FetchResponse {
  status: number;
  ok: boolean;
  json(): Promise<unknown>;
}

export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<FetchResponse>;

export interface ClientSession {
  user: AuthUser;
}

export type ClientStatus = 'authenticated' | 'unauthenticated';

export interface ClientLoadResult {
  session: ClientSession | null;
  status: ClientStatus;
}

export interface ClientSignInResult {
  session: ClientSession;
  status: 'authenticated';
}

export interface CreateSessionClientOptions {
  baseUrl?: string;
  storage: TokenStorage;
  fetchImpl?: FetchLike;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

export class ApiError extends Error {
  code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export function createSessionClient({
  baseUrl = '',
  storage,
  fetchImpl = fetch as FetchLike,
}: CreateSessionClientOptions) {
  function readToken(): string | null {
    return storage.getItem(TOKEN_KEY);
  }

  function writeToken(token: string | null): void {
    if (token) storage.setItem(TOKEN_KEY, token);
    else storage.removeItem(TOKEN_KEY);
  }

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
    const { method = 'GET', body, token } = options;
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) return null;

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const payload = isRecord(data) ? data : {};
      const message = typeof payload.message === 'string' ? payload.message : 'Não foi possível concluir. Tente de novo.';
      const code = typeof payload.code === 'string' ? payload.code : undefined;
      throw new ApiError(message, code);
    }
    return data as T;
  }

  return {
    readToken,

    async load(): Promise<ClientLoadResult> {
      const token = readToken();
      if (!token) return { session: null, status: 'unauthenticated' };

      try {
        const user = await request<AuthUser>('/api/me', { token });
        if (!user) return { session: null, status: 'unauthenticated' };
        return { session: { user }, status: 'authenticated' };
      } catch {
        writeToken(null);
        return { session: null, status: 'unauthenticated' };
      }
    },

    async register(input: RegisterInput): Promise<AuthUser> {
      const user = await request<AuthUser>('/api/register', { method: 'POST', body: input });
      if (!user) throw new ApiError('Não foi possível criar a conta. Tente de novo.');
      return user;
    },

    async signIn(input: LoginInput): Promise<ClientSignInResult> {
      const result = await request<{ token?: string; user?: AuthUser }>('/api/login', {
        method: 'POST',
        body: input,
      });
      if (!result?.token || !result.user) throw new ApiError('Não foi possível entrar. Tente de novo.');
      writeToken(result.token);
      return { session: { user: result.user }, status: 'authenticated' };
    },

    async signOut(): Promise<void> {
      const token = readToken();
      try {
        if (token) await request<null>('/api/logout', { method: 'POST', token });
      } finally {
        writeToken(null);
      }
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
