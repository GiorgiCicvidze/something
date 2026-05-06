# EternalHardcore

A Minecraft server landing page and admin panel for the EternalHardcore hardcore server (play.eternalhardcore.xyz).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/eternal-hardcore run dev` — run the frontend (port 21284)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec (then patch `lib/api-zod/src/index.ts` to only export `./generated/api`)
- Required env: `SESSION_SECRET` — for express-session admin auth

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + wouter + framer-motion + TanStack Query + shadcn/ui
- API: Express 5 + express-session + pino
- No database — in-memory store (`artifacts/api-server/src/lib/store.ts`)
- Validation: Zod (v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)

## Where things live

- `artifacts/eternal-hardcore/` — React+Vite frontend (preview path `/`)
- `artifacts/api-server/` — Express 5 backend (preview path `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/` — generated React Query hooks + custom fetch
- `lib/api-zod/src/generated/` — generated Zod schemas
- `artifacts/api-server/src/lib/store.ts` — in-memory state (players, settings)
- `artifacts/api-server/src/lib/minecraft.ts` — mcsrvstat.us integration
- `artifacts/api-server/src/lib/adminAuth.ts` — hardcoded admin accounts

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas
- Session auth uses `express-session` with `SESSION_SECRET` env var. Admin accounts are hardcoded (ducky/adminducky, critz/ownercritz). No DB required.
- MC server status fetched from public mcsrvstat.us API; can be overridden via admin panel.
- `customFetch` includes `credentials: "include"` so session cookies work for admin auth.
- Avatar URLs use `https://mc-heads.net/avatar/{username}`.

## Product

- **Public landing**: Animated hero with particle background, custom cursor, live server status badge, player count, clickable IP copy button, scrollable sections showing online players and leaderboard.
- **Admin panel** at `/admin`: Login page → dashboard with server control panel (MOTD, status override) + full player table with featured/unfeature toggles.

## User preferences

- Dark hardcore theme with crimson primary (348 83% 47%) and green secondary (120 100% 30%)
- Space Mono font throughout
- Admin accounts: `ducky` / `adminducky` (admin), `critz` / `ownercritz` (owner)
- Server IP: `play.eternalhardcore.xyz`

## Gotchas

- After running orval codegen, manually overwrite `lib/api-zod/src/index.ts` with `export * from "./generated/api";` — orval regenerates it with stale barrel exports.
- `lib/api-client-react` exports source directly (no build step); Vite picks it up as-is.
- API server listens on port 8080; frontend on port 21284. All traffic goes through the shared proxy at port 80.
- `sameSite: "none"` required in production for cross-origin cookie to work through the proxy.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.local/skills/pnpm-workspace/references/openapi.md` for codegen details
