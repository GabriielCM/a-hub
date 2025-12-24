# Guia de Agentes - A-hub

Este documento define todos os agentes especializados do projeto A-hub, suas responsabilidades e quando utilizá-los.

---

## Índice

1. [Agentes de Backend](#agentes-de-backend)
2. [Agentes de Frontend](#agentes-de-frontend)
3. [Agentes de Banco de Dados](#agentes-de-banco-de-dados)
4. [Agentes de Testes](#agentes-de-testes)
5. [Agentes de DevOps](#agentes-de-devops)
6. [Agentes de Domínio](#agentes-de-domínio)

---

## Agentes de Backend

### 1. `nestjs-module-creator`

**Descrição:** Cria novos módulos NestJS seguindo a estrutura padrão do projeto.

**Quando usar:**
- Adicionar nova funcionalidade ao backend
- Criar novo domínio de negócio

**Responsabilidades:**
- Criar estrutura de pastas do módulo
- Gerar arquivos: module, controller, service, DTOs
- Registrar módulo no `app.module.ts`
- Configurar injeção de dependências

**Arquivos que cria:**
```
src/{module-name}/
├── {module-name}.module.ts
├── {module-name}.controller.ts
├── {module-name}.service.ts
└── dto/
    ├── create-{module-name}.dto.ts
    └── update-{module-name}.dto.ts
```

**Contexto necessário:**
- Nome do módulo
- Campos/propriedades principais
- Se precisa de autenticação
- Se precisa de roles específicas

**Exemplo de prompt:**
```
Crie um novo módulo NestJS chamado "notifications" com:
- Campos: id, userId, title, message, read, createdAt
- Endpoints: listar minhas notificações, marcar como lida
- Autenticação obrigatória
```

---

### 2. `nestjs-endpoint-creator`

**Descrição:** Adiciona novos endpoints a módulos existentes.

**Quando usar:**
- Adicionar nova funcionalidade a módulo existente
- Criar endpoint específico (export, bulk operations, etc)

**Responsabilidades:**
- Adicionar método no controller
- Implementar lógica no service
- Criar/atualizar DTOs se necessário
- Aplicar guards e decorators apropriados

**Contexto necessário:**
- Módulo alvo
- Método HTTP e rota
- Parâmetros esperados
- Regras de acesso (público, autenticado, admin)

**Exemplo de prompt:**
```
Adicione ao módulo spaces um endpoint GET /spaces/:id/statistics
que retorna quantidade de bookings por status. Apenas admin.
```

---

### 3. `nestjs-guard-creator`

**Descrição:** Cria guards e decorators customizados.

**Quando usar:**
- Implementar nova regra de autorização
- Criar validação customizada de acesso

**Responsabilidades:**
- Criar guard em `common/guards/`
- Criar decorator associado se necessário
- Documentar uso

**Exemplo de prompt:**
```
Crie um guard que verifica se o usuário é dono do recurso
(booking ou space) antes de permitir a ação.
```

---

## Agentes de Frontend

### 4. `nextjs-page-creator`

**Descrição:** Cria novas páginas Next.js App Router.

**Quando usar:**
- Adicionar nova tela ao sistema
- Criar nova seção do dashboard

**Responsabilidades:**
- Criar arquivo `page.tsx` no diretório correto
- Implementar layout responsivo (mobile-first)
- Integrar com auth-context se necessário
- Usar componentes shadcn/ui existentes

**Estrutura de decisão:**
```
Página pública? → app/(auth)/ ou app/
Página autenticada? → app/(dashboard)/
Página admin? → app/(dashboard)/admin/
```

**Contexto necessário:**
- Caminho/rota da página
- Se é pública ou protegida
- Dados que precisa carregar
- Ações disponíveis

**Exemplo de prompt:**
```
Crie uma página /dashboard/perfil onde o usuário pode
ver e editar seus dados (nome, email). Use formulário
com validação.
```

---

### 5. `nextjs-component-creator`

**Descrição:** Cria componentes React reutilizáveis.

**Quando usar:**
- Criar componente que será usado em múltiplas páginas
- Extrair lógica complexa de uma página

**Responsabilidades:**
- Criar componente em `components/`
- Definir props com TypeScript
- Implementar responsividade
- Usar Tailwind CSS para estilização

**Estrutura de pastas:**
```
components/
├── ui/          # Componentes base (shadcn)
├── layout/      # Sidebar, navbar, footer
├── features/    # Componentes de domínio
└── forms/       # Componentes de formulário
```

**Exemplo de prompt:**
```
Crie um componente BookingCard que exibe informações
de um agendamento com botões de ação (cancelar, ver detalhes).
```

---

### 6. `shadcn-component-installer`

**Descrição:** Instala e configura componentes shadcn/ui.

**Quando usar:**
- Precisar de componente UI que ainda não existe
- Adicionar variantes a componentes existentes

**Responsabilidades:**
- Verificar se componente já existe
- Instalar via CLI ou criar manualmente
- Instalar dependências Radix necessárias
- Adaptar ao tema do projeto

**Componentes disponíveis no shadcn:**
```
accordion, alert, alert-dialog, avatar, badge, button,
calendar, card, checkbox, collapsible, combobox, command,
context-menu, dialog, dropdown-menu, form, hover-card,
input, label, menubar, navigation-menu, popover, progress,
radio-group, scroll-area, select, separator, sheet, skeleton,
slider, switch, table, tabs, textarea, toast, toggle, tooltip
```

**Exemplo de prompt:**
```
Instale o componente Calendar do shadcn para usar
na seleção de datas de agendamento.
```

---

### 7. `api-client-extender`

**Descrição:** Adiciona novos métodos ao cliente API do frontend.

**Quando usar:**
- Novo endpoint criado no backend
- Necessidade de integrar nova funcionalidade

**Responsabilidades:**
- Adicionar método em `lib/api.ts`
- Definir tipos de request/response
- Exportar novos types se necessário

**Padrão de implementação:**
```typescript
// Método público (sem token)
async getResource() {
  return this.request<ResourceType>('/resource');
}

// Método autenticado
async createResource(data: CreateData, token: string) {
  return this.request<ResourceType>('/resource', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}
```

**Exemplo de prompt:**
```
Adicione ao api.ts métodos para o novo módulo de notificações:
- getMyNotifications(token)
- markAsRead(id, token)
- markAllAsRead(token)
```

---

## Agentes de Banco de Dados

### 8. `prisma-model-creator`

**Descrição:** Cria ou modifica modelos no schema Prisma.

**Quando usar:**
- Adicionar nova entidade ao banco
- Modificar estrutura de tabela existente

**Responsabilidades:**
- Editar `prisma/schema.prisma`
- Definir campos, tipos e relações
- Criar enums se necessário
- Gerar migration

**Tipos Prisma comuns:**
```prisma
String, Int, Float, Boolean, DateTime, Json
@id @default(uuid())
@unique
@default(now())
@updatedAt
@relation(fields: [...], references: [...])
@db.Date, @db.Text
```

**Exemplo de prompt:**
```
Adicione ao Prisma um modelo Notification com:
- id (uuid)
- userId (relação com User)
- title, message (strings)
- read (boolean, default false)
- createdAt
```

---

### 9. `prisma-migration-runner`

**Descrição:** Executa operações de migration do Prisma.

**Quando usar:**
- Após modificar schema.prisma
- Sincronizar banco com schema

**Comandos:**
```bash
# Criar e aplicar migration
pnpm --filter @a-hub/backend run prisma:migrate

# Apenas gerar cliente (sem migration)
pnpm --filter @a-hub/backend run prisma:generate

# Reset completo (CUIDADO: apaga dados)
npx prisma migrate reset

# Ver status das migrations
npx prisma migrate status
```

---

### 10. `prisma-seed-updater`

**Descrição:** Atualiza script de seed com novos dados.

**Quando usar:**
- Adicionar dados de teste para novo modelo
- Modificar dados de seed existentes

**Arquivo:** `apps/backend/prisma/seed.ts`

**Exemplo de prompt:**
```
Atualize o seed.ts para criar notificações de boas-vindas
para cada usuário criado.
```

---

## Agentes de Testes

### 11. `jest-unit-test-creator`

**Descrição:** Cria testes unitários com Jest.

**Quando usar:**
- Testar services do backend
- Testar funções utilitárias

**Responsabilidades:**
- Criar arquivo `.spec.ts`
- Mockar dependências (PrismaService, etc)
- Cobrir casos de sucesso e erro

**Estrutura de teste:**
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ServiceName, PrismaService],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange, Act, Assert
    });
  });
});
```

---

### 12. `e2e-test-creator`

**Descrição:** Cria testes end-to-end.

**Quando usar:**
- Testar fluxo completo de API
- Validar integração entre módulos

**Arquivo:** `apps/backend/test/*.e2e-spec.ts`

---

## Agentes de DevOps

### 13. `docker-config-creator`

**Descrição:** Cria configurações Docker para o projeto.

**Quando usar:**
- Containerizar aplicação
- Configurar ambiente de desenvolvimento

**Arquivos que cria:**
```
Dockerfile (frontend)
Dockerfile (backend)
docker-compose.yml
docker-compose.dev.yml
.dockerignore
```

---

### 14. `ci-cd-pipeline-creator`

**Descrição:** Cria pipelines de CI/CD.

**Quando usar:**
- Configurar GitHub Actions
- Automatizar deploy

**Arquivos que cria:**
```
.github/workflows/
├── ci.yml          # Lint, test, build
├── deploy.yml      # Deploy para produção
└── preview.yml     # Deploy de preview
```

---

### 15. `env-config-manager`

**Descrição:** Gerencia variáveis de ambiente.

**Quando usar:**
- Adicionar nova variável de ambiente
- Documentar configurações

**Arquivos:**
```
.env.example (backend)
.env.local.example (frontend)
```

---

## Agentes de Domínio

Agentes especializados nas regras de negócio do A-hub.

### 16. `booking-feature-developer`

**Descrição:** Desenvolve funcionalidades relacionadas a agendamentos.

**Quando usar:**
- Modificar fluxo de reserva
- Adicionar regras de negócio de booking
- Implementar notificações de booking

**Conhecimento específico:**
- Regra: um booking por espaço por dia
- Status: PENDING → APPROVED/REJECTED/CANCELLED
- Apenas admin aprova/rejeita
- Usuário só cancela próprio booking

**Arquivos relacionados:**
- `backend: src/bookings/*`
- `frontend: app/(dashboard)/dashboard/agendamentos/*`
- `frontend: app/(dashboard)/admin/relatorios/*`
- `docs: module-documentation/backend-bookings.md`

---

### 17. `space-feature-developer`

**Descrição:** Desenvolve funcionalidades relacionadas a espaços.

**Quando usar:**
- Adicionar campos ao espaço
- Modificar regras de disponibilidade
- Implementar recursos visuais (galeria, etc)

**Conhecimento específico:**
- Nome do espaço é único
- Fotos armazenadas no Cloudinary
- Disponibilidade calculada por mês

**Arquivos relacionados:**
- `backend: src/spaces/*`
- `frontend: app/(dashboard)/dashboard/espacos/*`
- `frontend: app/(dashboard)/admin/espacos/*`
- `docs: module-documentation/backend-spaces.md`

---

### 18. `user-feature-developer`

**Descrição:** Desenvolve funcionalidades relacionadas a usuários.

**Quando usar:**
- Modificar perfil de usuário
- Adicionar campos ao usuário
- Implementar funcionalidades por role

**Conhecimento específico:**
- Roles: COLLABORATOR, ADMIN, DISPLAY
- Password hashado com bcrypt
- RefreshToken hashado no banco

**Arquivos relacionados:**
- `backend: src/users/*`, `src/auth/*`
- `frontend: lib/auth-context.tsx`
- `frontend: app/(dashboard)/admin/usuarios/*`
- `docs: module-documentation/backend-users.md`, `backend-auth.md`

---

### 19. `report-feature-developer`

**Descrição:** Desenvolve funcionalidades de relatórios e exportação.

**Quando usar:**
- Criar novos relatórios
- Adicionar filtros
- Implementar novos formatos de export

**Funcionalidades existentes:**
- Export CSV de bookings
- Filtro por status

**Arquivos relacionados:**
- `backend: src/bookings/bookings.service.ts (exportToCsv)`
- `frontend: app/(dashboard)/admin/relatorios/*`

---

### 20. `notification-feature-developer`

**Descrição:** Desenvolve sistema de notificações (a implementar).

**Quando usar:**
- Implementar notificações in-app
- Configurar push notifications (PWA)
- Notificar sobre mudanças de status

**Escopo futuro:**
- Notificação quando booking é aprovado/rejeitado
- Notificação de lembrete (1 dia antes)
- Badge de notificações não lidas

---

## Agentes Utilitários

### 21. `documentation-updater`

**Descrição:** Mantém documentação atualizada.

**Quando usar:**
- Após criar/modificar módulo
- Após adicionar endpoint
- Após mudar regras de negócio

**Arquivos:**
- `CLAUDE.md`
- `module-documentation/*.md`

---

### 22. `code-reviewer`

**Descrição:** Revisa código implementado.

**Quando usar:**
- Após implementar feature significativa
- Antes de commit

**Checklist:**
- [ ] TypeScript sem erros
- [ ] Validações adequadas
- [ ] Guards aplicados corretamente
- [ ] Responsividade (mobile-first)
- [ ] Tratamento de erros
- [ ] Sem dados sensíveis expostos

---

### 23. `refactoring-agent`

**Descrição:** Refatora código existente.

**Quando usar:**
- Código duplicado identificado
- Performance a melhorar
- Padrões inconsistentes

**Princípios:**
- DRY (Don't Repeat Yourself)
- Single Responsibility
- Manter compatibilidade de API

---

## Fluxo de Trabalho Recomendado

### Criar nova funcionalidade completa:

```
1. prisma-model-creator      → Criar modelo no banco
2. prisma-migration-runner   → Aplicar migration
3. nestjs-module-creator     → Criar módulo backend
4. api-client-extender       → Adicionar ao cliente frontend
5. nextjs-page-creator       → Criar páginas
6. jest-unit-test-creator    → Criar testes
7. documentation-updater     → Atualizar docs
8. code-reviewer             → Revisar implementação
```

### Adicionar endpoint a módulo existente:

```
1. nestjs-endpoint-creator   → Criar endpoint
2. api-client-extender       → Adicionar ao cliente
3. documentation-updater     → Atualizar docs
```

### Criar nova página:

```
1. nextjs-page-creator       → Criar página
2. nextjs-component-creator  → Criar componentes (se necessário)
3. shadcn-component-installer → Instalar UI components (se necessário)
```
