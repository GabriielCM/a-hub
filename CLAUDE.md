# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A-hub is a PWA for Associacao Cristofoli - a space booking platform where collaborators can reserve spaces (party halls, BBQ areas, pools, etc.) and admins manage bookings.

## Tech Stack

- **Monorepo:** Turborepo with pnpm workspaces
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui (Radix)
- **Backend:** NestJS 10, REST API, Prisma ORM, PostgreSQL
- **Auth:** JWT + refresh tokens (stored in localStorage)
- **Storage:** Cloudinary for images

## Common Commands

```bash
# Development (runs both frontend on :3000 and backend on :3001)
pnpm dev

# Build all apps
pnpm build

# Lint all apps
pnpm lint

# Format code
pnpm format
```

### Backend-specific (run from root with filter or from apps/backend)
```bash
pnpm --filter @a-hub/backend run prisma:migrate    # Run migrations
pnpm --filter @a-hub/backend run prisma:generate   # Generate Prisma client
pnpm --filter @a-hub/backend run prisma:seed       # Seed database with test data
pnpm --filter @a-hub/backend run prisma:studio     # Visual DB browser
pnpm --filter @a-hub/backend run test              # Run tests
pnpm --filter @a-hub/backend run test:watch        # Watch mode
```

### Frontend-specific
```bash
pnpm --filter @a-hub/frontend run build
pnpm --filter @a-hub/frontend run lint
```

## Architecture

### Monorepo Structure
```
apps/
  backend/      # NestJS API (@a-hub/backend)
  frontend/     # Next.js PWA (@a-hub/frontend)
packages/
  shared/       # Shared TypeScript types (@a-hub/shared)
```

### Backend Modules
- `auth/` - JWT authentication with access/refresh tokens
- `users/` - User CRUD, role management
- `spaces/` - Space CRUD with photo uploads
- `bookings/` - Booking lifecycle, approval workflow
- `upload/` - Cloudinary integration
- `prisma/` - Database service

### Frontend Structure
- `app/(auth)/` - Login and register pages
- `app/(dashboard)/` - Protected routes with sidebar layout
- `app/(dashboard)/admin/` - Admin-only pages (espacos, usuarios, relatorios)
- `lib/auth-context.tsx` - Auth state management (exposes `accessToken`, not `token`)
- `lib/api.ts` - API client with all endpoint methods

### Database Models
- **User:** email, password (bcrypt), name, role (COLLABORATOR|ADMIN|DISPLAY)
- **Space:** name (unique), value, photos[], description
- **Booking:** date (unique per space), status (PENDING|APPROVED|REJECTED|CANCELLED)

### Role-Based Access
- **COLLABORATOR:** View spaces, create/manage own bookings
- **ADMIN:** Full access - CRUD spaces/users, approve bookings, export CSV
- **DISPLAY:** View-only for kiosk displays

## Key Patterns

### Auth Context Usage
```typescript
const { user, accessToken, isAuthenticated, login, logout } = useAuth();
// Note: use `accessToken`, not `token`
```

### API Calls
```typescript
import { api } from '@/lib/api';
await api.getSpaces();                           // Public
await api.createBooking(data, accessToken);      // Authenticated
await api.updateUser(id, data, accessToken);     // Admin only
```

### Backend Guards
```typescript
@UseGuards(JwtAuthGuard)           // Requires valid JWT
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)                 // Admin only
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/a_hub
JWT_SECRET=secret
JWT_REFRESH_SECRET=refresh_secret
CLOUDINARY_URL=cloudinary://key:secret@cloud
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Mobile Access:** When testing on mobile devices via local network, change `localhost` to your machine's IP (e.g., `http://192.168.1.7:3001/api`).

## Test Users (after seeding)
- Admin: `admin@cristofoli.com.br` / `admin123`
- User: `joao@cristofoli.com.br` / `user123`
- Display: `display@cristofoli.com.br` / `display123`

## Module Documentation

Documentação detalhada de cada módulo está disponível em `module-documentation/`:

| Arquivo | Módulo |
|---------|--------|
| `backend-auth.md` | Autenticação JWT, guards, estratégias |
| `backend-users.md` | CRUD de usuários, roles |
| `backend-spaces.md` | CRUD de espaços, disponibilidade |
| `backend-bookings.md` | Agendamentos, fluxo de aprovação, CSV |
| `backend-upload.md` | Upload de imagens (Cloudinary) |
| `frontend-auth-context.md` | Context de autenticação React |
| `frontend-api-client.md` | Cliente HTTP, types, métodos |
| `agents-guide.md` | **Guia completo de agentes do projeto** |

### Regras para o Agente

1. **Consultar documentação:** Antes de modificar um módulo, leia a documentação correspondente em `module-documentation/` para entender endpoints, validações e regras de negócio.

2. **Atualizar documentação:** Após implementar mudanças significativas em um módulo (novos endpoints, campos, validações, regras), atualize o arquivo de documentação correspondente.

3. **Manter consistência:** Se adicionar novos módulos, crie a documentação seguindo o mesmo padrão dos existentes.

---

## Agentes Especializados

Consulte `module-documentation/agents-guide.md` para documentação completa de todos os agentes.

### Quando Usar Cada Agente

#### Backend

| Tarefa | Agente |
|--------|--------|
| Criar novo módulo NestJS | `nestjs-module-creator` |
| Adicionar endpoint a módulo existente | `nestjs-endpoint-creator` |
| Criar guard/decorator customizado | `nestjs-guard-creator` |
| Criar/modificar modelo Prisma | `prisma-model-creator` |
| Rodar migrations | `prisma-migration-runner` |
| Atualizar dados de seed | `prisma-seed-updater` |

#### Frontend

| Tarefa | Agente |
|--------|--------|
| Criar nova página | `nextjs-page-creator` |
| Criar componente reutilizável | `nextjs-component-creator` |
| Instalar componente shadcn/ui | `shadcn-component-installer` |
| Adicionar método ao api.ts | `api-client-extender` |

#### Domínio (Regras de Negócio)

| Tarefa | Agente |
|--------|--------|
| Funcionalidades de agendamento | `booking-feature-developer` |
| Funcionalidades de espaços | `space-feature-developer` |
| Funcionalidades de usuários/auth | `user-feature-developer` |
| Relatórios e exportação | `report-feature-developer` |
| Sistema de notificações | `notification-feature-developer` |

#### DevOps e Qualidade

| Tarefa | Agente |
|--------|--------|
| Criar testes unitários | `jest-unit-test-creator` |
| Criar testes E2E | `e2e-test-creator` |
| Configurar Docker | `docker-config-creator` |
| Configurar CI/CD | `ci-cd-pipeline-creator` |
| Gerenciar variáveis de ambiente | `env-config-manager` |

#### Utilitários

| Tarefa | Agente |
|--------|--------|
| Atualizar documentação | `documentation-updater` |
| Revisar código implementado | `code-reviewer` |
| Refatorar código existente | `refactoring-agent` |

### Fluxo de Trabalho Padrão

**Nova funcionalidade completa:**
```
prisma-model-creator → prisma-migration-runner → nestjs-module-creator
→ api-client-extender → nextjs-page-creator → documentation-updater
```

**Novo endpoint em módulo existente:**
```
nestjs-endpoint-creator → api-client-extender → documentation-updater
```

**Nova página frontend:**
```
nextjs-page-creator → nextjs-component-creator (se necessário)
→ shadcn-component-installer (se necessário)
```
