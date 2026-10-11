import type { SessionStatus } from "@curso/login-sdk/react";

export const status = {
  loading: "loading",
  authenticated: "authenticated",
  unauthenticated: "unauthenticated",
} as const satisfies Record<SessionStatus, SessionStatus>;
