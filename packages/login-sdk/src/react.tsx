import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createSessionClient, type ClientSession } from './client.ts';
import { ROLES } from './roles.ts';
import type { AuthUser, LoginInput, RegisterInput } from './types.ts';

export { ROLES };

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface UseSessionResult {
  /** Usuário da sessão aberta. `null` enquanto carrega ou sem login. */
  data: ClientSession | null;
  /** `"authenticated"` quando há sessão. `"unauthenticated"` quando não há. */
  status: SessionStatus;
}

export interface SessionProviderProps {
  children: ReactNode;
  /** Prefixo da API. Vazio usa a mesma origem (`/api/...`). */
  baseUrl?: string;
}

interface BoundClient {
  register(input: RegisterInput): Promise<AuthUser>;
  signIn(input: LoginInput): Promise<void>;
  signOut(): Promise<void>;
}

const SessionContext = createContext<UseSessionResult | null>(null);

let bound: BoundClient | null = null;

function browserStorage() {
  if (typeof localStorage === 'undefined') {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key),
    };
  }
  return localStorage;
}

export function SessionProvider({ children, baseUrl = '' }: SessionProviderProps) {
  const client = useMemo(
    () => createSessionClient({ baseUrl, storage: browserStorage() }),
    [baseUrl],
  );
  const [session, setSession] = useState<ClientSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>(() =>
    client.readToken() ? 'loading' : 'unauthenticated',
  );
  const generation = useRef(0);

  useEffect(() => {
    const id = ++generation.current;
    if (!client.readToken()) {
      setSession(null);
      setStatus('unauthenticated');
      return;
    }

    setStatus((current) => (current === 'authenticated' ? current : 'loading'));
    client.load().then((result) => {
      if (generation.current !== id) return;
      setSession(result.session);
      setStatus(result.status);
    });
  }, [client]);

  useEffect(() => {
    bound = {
      register(input) {
        return client.register(input);
      },
      async signIn(input) {
        const result = await client.signIn(input);
        generation.current += 1;
        setSession(result.session);
        setStatus(result.status);
      },
      async signOut() {
        generation.current += 1;
        try {
          await client.signOut();
        } catch {
          // O token já saiu do navegador. A sessão local termina mesmo assim.
        }
        setSession(null);
        setStatus('unauthenticated');
      },
    };

    return () => {
      bound = null;
    };
  }, [client]);

  const value = useMemo<UseSessionResult>(
    () => ({
      data: status === 'authenticated' ? session : null,
      status,
    }),
    [session, status],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): UseSessionResult {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession precisa ficar dentro de SessionProvider.');
  }
  return value;
}

export function signIn(input: LoginInput): Promise<void> {
  if (!bound) throw new Error('signIn precisa do SessionProvider.');
  return bound.signIn(input);
}

export function signOut(): Promise<void> {
  if (!bound) throw new Error('signOut precisa do SessionProvider.');
  return bound.signOut();
}

export function register(input: RegisterInput): Promise<AuthUser> {
  if (!bound) throw new Error('register precisa do SessionProvider.');
  return bound.register(input);
}
