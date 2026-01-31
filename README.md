# DataHub

A multi-tenant data room platform for secure file sharing and pipeline processing.

## Features

- **Multi-tenant Architecture**: Supports multiple tenants with isolated data rooms
- **Hierarchical Folders**: Organize files in nested folder structures
- **File Versioning**: Track and manage multiple versions of uploaded files
- **Pipeline Processing**: Automated file processing with configurable steps:
  - Malware scanning
  - PII detection and review
  - Data validation
  - Ingestion
  - Control checks
  - Alert routing
  - Reconciliation
- **Real-time Status**: Track pipeline execution status per file

## Architecture

This is a monorepo using pnpm workspaces:

```
apps/
  api/          # Hono HTTP server with SQLite/Drizzle
  web/          # React SPA with Vite, TailwindCSS, TanStack Query
packages/
  shared/       # Zod schemas and TypeScript types shared between apps
```

### Data Model

```
Tenants → DataRooms → Folders → Files → FileVersions
                   → Pipelines → PipelineRuns → PipelineRunSteps
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
pnpm install
```

### Development

```bash
# Run both API and web app
pnpm dev

# Or run individually
pnpm dev:api          # API server on port 3001
pnpm dev:web          # Vite dev server
```

### Database

```bash
pnpm db:init          # Initialize database with schema
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
```

### Testing

```bash
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm typecheck        # Type checking
pnpm lint             # Linting
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `DATABASE_URL` | SQLite database path | `./data/datahub.db` |
| `STORAGE_PATH` | File upload storage path | `./data/uploads` |
| `VITE_API_URL` | API URL for web app | `http://localhost:3001` |
| `VITE_API_TOKEN` | Auth token for development | - |

## License

MIT
