import { ROLES } from "@curso/login-sdk/react";
import { z } from "zod";

export { ROLES };

export const DEFAULT_ROLE = "USER" as const;

export const ROLE_LABEL = {
  ADM: "ADM — administrador",
  MOD: "MOD — moderador",
  USER: "USER — usuário",
  GUEST: "GUEST — convidado",
} as const;

export const roleSchema = z.enum(
  ROLES,
  "Escolha uma permissão: administrador, moderador, usuário ou convidado.",
);
