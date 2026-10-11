# sdk-auth

SDK de login com SQLite. O pacote que outro projeto instala é `@curso/login-sdk`. Este repositório também tem uma API Express e uma tela React para mostrar a SDK em uso. Essas duas apps são `private` e não entram no `npm install`.

O código está em TypeScript. O Node executa os `.ts` direto, sem passo de build. O SQL mora em `packages/login-sdk/sql/schema.sql`.

## Instalação

No projeto que vai usar a SDK:

```bash
npm install @curso/login-sdk
```

O install traz `src` e `sql`. Não traz `node_modules` nem `auth.sqlite`. Precisa de Node.js 22.6 ou mais novo. React 18 ou mais novo só é necessário se o projeto importar `@curso/login-sdk/react`.

O caminho padrão do banco é `data/auth.sqlite` ao lado do código do pacote. Depois do install, esse caminho cai dentro de `node_modules` e some na próxima instalação. O projeto que instalou a SDK cria o arquivo num caminho seu e passa esse caminho para `createAuth`:

```ts
import { createAuth, createDatabaseFile } from "@curso/login-sdk";

const file = createDatabaseFile("./data/auth.sqlite");
const auth = createAuth({ file });
```

`./data/auth.sqlite` fica no projeto consumidor. `users` e `sessions` nascem nesse arquivo. Sem `file`, a SDK grava dentro do próprio pacote — serve para este repositório, não para quem instalou.

## Comandos deste repositório

Na raiz, para rodar o exemplo:

```bash
npm install
npm run db:create
npm run dev
```

| Comando | O que faz |
| --- | --- |
| `npm run db:create` | Cria `packages/login-sdk/data/auth.sqlite` e as tabelas `users` e `sessions` |
| `npm run dev` | Cria o arquivo, sobe a API e a tela |
| `npm run dev:api` | Só a API, em http://localhost:3333 |
| `npm run dev:web` | Só a tela, em http://localhost:5173 |
| `npm test` | Testes da SDK |

A tela fala com a API por `/api`. A API usa `@curso/login-sdk`.

## Pacotes

| Pasta | Pacote |
| --- | --- |
| `packages/login-sdk` | `@curso/login-sdk`, o pacote instalável |
| `apps/api` | `@curso/api`, exemplo, `private` |
| `apps/web` | `@curso/web`, exemplo, `private` |

## SDK

No React, o `SessionProvider` guarda o token e a tela só pergunta o status. Igual o [`SessionProvider` do NextAuth](https://next-auth.js.org/).

```tsx
import { SessionProvider, useSession, signIn, signOut } from "@curso/login-sdk/react";

function Root() {
  return (
    <SessionProvider>
      <App />
    </SessionProvider>
  );
}

function App() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Abrindo sessão</p>;
  if (status === "authenticated") {
    return (
      <>
        <p>{session.user.email}</p>
        <button onClick={() => signOut()}>Sair</button>
      </>
    );
  }
  return <button onClick={() => signIn({ email, password })}>Entrar</button>;
}
```

`status` é `"loading"`, `"authenticated"` ou `"unauthenticated"`. `register({ email, password, role })` cria a conta e não abre sessão. Sem `role`, a conta nasce `USER`. Depois do `signIn`, `session.user.role` e `session.user.permissions` vêm do login.

No servidor, crie o arquivo no terminal antes de usar a SDK:

```bash
npm run db:create
```

O comando cria `packages/login-sdk/data/auth.sqlite` e as tabelas `users` e `sessions`. `npm run dev` roda esse passo sozinho.

```ts
import { createAuth } from "@curso/login-sdk";

const auth = createAuth();
await auth.register({
  email: "ana@curso.dev",
  password: "senha-do-exemplo",
  role: "ADM",
});
const session = await auth.login({
  email: "ana@curso.dev",
  password: "senha-do-exemplo",
});
session.user.role; // "ADM"
session.user.permissions; // inclui "users:write"
auth.can(session.token, "users:write"); // true
const user = auth.me(session.token);
auth.logout(session.token);
```

Quem instalou `@curso/login-sdk` passa `file` com um caminho do próprio projeto, como na seção Instalação. Sem `file`, a SDK usa o `auth.sqlite` de dentro do pacote.

`register` e `login` são assíncronos por causa do `scrypt`. `me`, `can` e `logout` só leem o arquivo.

O papel entra no `register`. Sem `role`, a conta nasce `USER`. O `login` não escolhe papel: devolve o que já está gravado, mais a lista `permissions`. `auth.can(token, permissão)` responde se a sessão tem aquela permissão. `ROLES` exporta os quatro nomes.

| Papel | Quem é | Permissões |
| --- | --- | --- |
| `ADM` | administrador | `users:read`, `users:write`, `content:moderate`, `content:write`, `content:read` |
| `MOD` | moderador | `content:moderate`, `content:write`, `content:read` |
| `USER` | usuário, padrão | `content:write`, `content:read` |
| `GUEST` | convidado | `content:read` |

`adm` e `Adm` viram `ADM`. Outro nome cai em `INVALID_INPUT`. Banco criado antes desta coluna ganha `role` com valor `USER` na próxima abertura.

Na tela, a permissão do formulário vale só em **Criar conta**. Depois do login, a sessão mostra o papel e as permissões.

| Código | Quando |
| --- | --- |
| `INVALID_INPUT` | e-mail inválido, senha com menos de 8 caracteres ou papel fora de `ADM`, `MOD`, `USER` e `GUEST` |
| `EMAIL_IN_USE` | e-mail já cadastrado |
| `INVALID_CREDENTIALS` | e-mail ou senha não conferem |

Precisa de Node.js 22.6 ou mais novo, pelo `node:sqlite` e pelo TypeScript nativo. O Node pode avisar que o `node:sqlite` ainda é experimental.

Sem e-mail de confirmação, sem reset de senha, sem OAuth e sem deploy.
