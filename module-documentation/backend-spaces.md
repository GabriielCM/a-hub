# Modulo: Spaces (Backend)

**Localização:** `apps/backend/src/spaces/`

## Visão Geral

Gerenciamento de espaços disponíveis para agendamento (salão de festas, churrasqueira, piscina, etc).

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `spaces.module.ts` | Configuração do módulo NestJS |
| `spaces.service.ts` | Lógica de negócio |
| `spaces.controller.ts` | Endpoints REST |
| `dto/create-space.dto.ts` | DTO para criação |
| `dto/update-space.dto.ts` | DTO para atualização |

## Modelo de Dados

```prisma
model Space {
  id          String    @id @default(uuid())
  name        String    @unique
  value       Float
  photos      String[]
  description String?
  bookings    Booking[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## Endpoints

### GET `/spaces` (Público)
Lista todos os espaços ordenados por nome.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Salão de Festas",
    "value": 500.00,
    "photos": ["https://cloudinary.com/..."],
    "description": "Salão com capacidade para 100 pessoas"
  }
]
```

### GET `/spaces/:id` (Público)
Retorna espaço com bookings futuros (PENDING e APPROVED).

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "value": 500.00,
  "photos": [],
  "description": "string",
  "bookings": [
    { "id": "uuid", "date": "2025-01-15", "status": "APPROVED" }
  ]
}
```

### GET `/spaces/:id/availability` (Público)
Retorna disponibilidade do espaço para um mês específico.

**Query params:**
- `month` (opcional, default: mês atual)
- `year` (opcional, default: ano atual)

**Response:**
```json
{
  "spaceId": "uuid",
  "month": 1,
  "year": 2025,
  "bookedDates": [
    { "date": "2025-01-15", "status": "APPROVED" },
    { "date": "2025-01-20", "status": "PENDING" }
  ]
}
```

### POST `/spaces` (Admin)
Cria novo espaço.

**Body:**
```json
{
  "name": "string (único)",
  "value": 500.00,
  "photos": ["url1", "url2"],
  "description": "string (opcional)"
}
```

**Erros:**
- `409 Conflict` - Nome já existe

### PATCH `/spaces/:id` (Admin)
Atualiza espaço.

**Body:** Campos parciais de CreateSpaceDto

### DELETE `/spaces/:id` (Admin)
Remove espaço. Bookings são deletados em cascade.

## Métodos do Service

### create(createSpaceDto)
Cria espaço. Verifica unicidade do nome.

### findAll()
Lista todos ordenados por nome.

### findById(id)
Busca com bookings futuros incluídos.

### update(id, updateSpaceDto)
Atualiza. Se mudar nome, verifica unicidade.

### remove(id)
Remove espaço.

### getAvailability(id, month, year)
Retorna datas ocupadas (PENDING ou APPROVED) no mês.

## Validações

- **Nome único:** Verificado no create e update
- **Fotos:** Array de URLs (do Cloudinary)

## Guards

- Endpoints públicos: GET `/spaces`, GET `/spaces/:id`, GET `/spaces/:id/availability`
- Endpoints admin: POST, PATCH, DELETE (requerem `JwtAuthGuard` + `RolesGuard` + `@Roles(Role.ADMIN)`)
