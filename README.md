# Adda

Next.js Web + NestJS API monorepo with shared packages.

## Structure

```
adda/
├── apps/
│   ├── web/          # Next.js app (port 3000)
│   └── api/          # NestJS API (port 4000)
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utility functions
│   └── config/       # Shared configuration
├── configs/
│   ├── eslint/       # Shared ESLint configs
│   └── typescript/   # Shared TypeScript configs
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

```bash
pnpm install
pnpm dev
```

## Commands

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `pnpm dev`        | Start all apps in dev mode       |
| `pnpm build`      | Build all apps and packages      |
| `pnpm lint`       | Lint all apps and packages       |
| `pnpm lint:fix`   | Fix lint issues                  |
| `pnpm format`     | Check formatting                 |
| `pnpm format:fix` | Fix formatting                   |
| `pnpm typecheck`  | Type-check all apps and packages |
| `pnpm clean`      | Remove all build artifacts       |
