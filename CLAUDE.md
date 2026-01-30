# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development (runs both api and web in parallel)
pnpm dev

# Run individual apps
pnpm dev:api          # API server on port 3001
pnpm dev:web          # Vite dev server (React app)

# Build all packages
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Testing
pnpm test                           # Run all tests
pnpm test:watch                     # Watch mode
pnpm --filter @datahub/api test     # Run tests for a specific package
pnpm --filter @datahub/web test

# Database (SQLite via Drizzle)
pnpm db:init          # Initialize database with schema
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
```

## Architecture Overview

**Monorepo Structure** (pnpm workspaces):
- `apps/api` - Hono HTTP server with SQLite/Drizzle
- `apps/web` - React SPA with Vite, TailwindCSS, TanStack Query
- `packages/shared` - Zod schemas and TypeScript types shared between api and web

**API App** (`apps/api`):
- Entry: `src/index.ts` creates Hono app with dependency injection for db and storage
- Routes in `src/routes/` - CRUD for tenants, users, data-rooms, folders, files, pipelines
- Database schema in `src/db/schema.ts` using Drizzle ORM
- Background job processing in `src/jobs/` with `PipelineProcessor` and `JobQueue`
- Auth middleware in `src/middleware/auth.ts` using Bearer tokens

**Web App** (`apps/web`):
- Entry: `src/main.tsx` → `src/App.tsx` sets up routing and providers
- Pages in `src/pages/` - Dashboard, DataRooms, DataRoomDetail, FileDetail
- API client in `src/lib/api.ts` provides typed fetch wrapper via React context
- UI components in `src/components/` using CVA for variant styling

**Data Model** (multi-tenant):
- Tenants → DataRooms → Folders (hierarchical) → Files → FileVersions
- Pipelines attached to DataRooms with configurable steps
- PipelineRuns track execution of steps against file versions

**Environment Variables**:
- `PORT` - API server port (default: 3001)
- `DATABASE_URL` - SQLite database path (default: ./data/datahub.db)
- `STORAGE_PATH` - File upload storage path (default: ./data/uploads)
- `VITE_API_URL` - API URL for web app (default: http://localhost:3001)
- `VITE_API_TOKEN` - Auth token for development
