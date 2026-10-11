# Nucleus

Design system interno baseado em [shadcn/ui](https://ui.shadcn.com), distribuído como **um único pacote versionado**.

27 componentes, tokens de tema light/dark e Storybook com documentação viva.

## Instalação

```bash
npm install @isaac545454/nucleus
```

## Setup no projeto consumidor

1. Importe os estilos (uma vez, no entry da app):

```ts
import "@isaac545454/nucleus/styles.css";
```

2. Se a app também usa Tailwind, adicione o preset para compartilhar os mesmos tokens:

```ts
// tailwind.config.ts
import nucleusPreset from "@isaac545454/nucleus/tailwind-preset";

export default {
  presets: [nucleusPreset],
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@isaac545454/nucleus/dist/**/*.js",
  ],
};
```

## Uso

```tsx
import { Button, Input, Label, Dialog, DialogContent, DialogTrigger } from "@isaac545454/nucleus";

export function LoginDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Entrar</Button>
      </DialogTrigger>
      <DialogContent>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" placeholder="voce@empresa.com" />
        <Button type="submit">Confirmar</Button>
      </DialogContent>
    </Dialog>
  );
}
```

## Componentes

| Categoria | Componentes |
|---|---|
| Overlays | Dialog, AlertDialog, Sheet, Popover, Tooltip, DropdownMenu |
| Forms | Button, Input, Textarea, Label, Checkbox, RadioGroup, Switch, Select, Toggle, Slider |
| Layout | Card, Tabs, Accordion, Separator, ScrollArea, Table |
| Feedback | Alert, Badge, Avatar, Progress, Skeleton |

## Storybook

```bash
npm run storybook          # dev server em http://localhost:6006
npm run build-storybook    # build estático em storybook-static/
```

## Adicionando um novo componente

A lib mantém o `components.json`, então o CLI do shadcn funciona dentro dela:

```bash
npx shadcn@latest add calendar
```

Depois exporte no barrel:

```ts
// src/index.ts
export * from "./components/ui/calendar";
```

E crie `src/components/ui/calendar.stories.tsx`.

## Versionamento e release

Cada PR adiciona uma entrada em `## [Unreleased]` no `CHANGELOG.md`. O CI recusa o PR sem uma entrada nova nessa seção.

No merge em `master`, o workflow:

1. Lê os commits desde a última tag (`feat` = minor, `fix` = patch, breaking = major).
2. Move o `Unreleased` para `## [x.y.z] - data`, sobe `package.json` e commita.
3. Publica no GitHub Packages e abre a GitHub Release com essas notas.

| Mudança | Versão |
|---|---|
| Fix em componente existente | patch (0.2.1) |
| Novo componente / variant (`feat`) | minor (0.3.0) |
| Breaking change (`feat!` ou `BREAKING CHANGE`) | major (1.0.0) |

## Desenvolvimento

```bash
pnpm install
pnpm run typecheck
pnpm run build      # gera dist/ (ESM + types + CSS)
pnpm run storybook
```

> **Rede corporativa**: se `npx shadcn` falhar com `unable to get local issuer certificate`,
> exporte a CA da empresa e aponte o Node para ela:
> ```bash
> security find-certificate -a -p /Library/Keychains/System.keychain > ~/.certs/corp-ca.pem
> export NODE_EXTRA_CA_CERTS=~/.certs/corp-ca.pem
> ```
