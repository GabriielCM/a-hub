# Modulo: Member Cards (Backend)

**Localizacao:** `apps/backend/src/member-cards/`

## Visao Geral

Gerenciamento de carteirinhas de associados (member cards). Cada usuario pode ter uma carteirinha que serve como identificacao na associacao, contendo matricula unica e QR code para validacao.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `member-cards.module.ts` | Configuracao do modulo NestJS |
| `member-cards.service.ts` | Logica de negocio |
| `member-cards.controller.ts` | Endpoints REST |
| `dto/create-member-card.dto.ts` | DTO para criacao |
| `dto/update-member-card.dto.ts` | DTO para atualizacao |

## Modelo de Dados

```prisma
model MemberCard {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  matricula Int      @unique
  photo     String?
  qrCode    String   @unique @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Campos

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | UUID | Identificador unico da carteirinha |
| `userId` | UUID | ID do usuario (relacao 1:1, unico) |
| `matricula` | Int | Numero de matricula unico (1-9999) |
| `photo` | String? | URL da foto do associado (Cloudinary) |
| `qrCode` | UUID | Codigo QR gerado automaticamente |
| `createdAt` | DateTime | Data de criacao |
| `updatedAt` | DateTime | Data da ultima atualizacao |

## Endpoints

### POST `/member-cards` (Admin)
Cria uma nova carteirinha para um usuario.

**Acesso:** Apenas ADMIN

**Body:**
```json
{
  "userId": "uuid (obrigatorio)",
  "matricula": 1234,
  "photo": "https://cloudinary.com/... (opcional)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "matricula": 1234,
  "photo": "https://cloudinary.com/...",
  "qrCode": "uuid-gerado-automaticamente",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

**Erros:**
- `400 Bad Request` - Usuario ja possui carteirinha
- `400 Bad Request` - Matricula ja existe
- `400 Bad Request` - Usuario com role DISPLAY nao pode ter carteirinha
- `404 Not Found` - Usuario nao encontrado

### GET `/member-cards` (Admin)
Lista todas as carteirinhas com dados do usuario.

**Acesso:** Apenas ADMIN

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "matricula": 1234,
    "photo": "https://...",
    "qrCode": "uuid",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "user": {
      "id": "uuid",
      "name": "Joao Silva",
      "email": "joao@cristofoli.com.br",
      "role": "COLLABORATOR"
    }
  }
]
```

### GET `/member-cards/my` (Autenticado)
Retorna a carteirinha do usuario autenticado.

**Acesso:** Qualquer usuario autenticado

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "matricula": 1234,
  "photo": "https://...",
  "qrCode": "uuid",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

**Erros:**
- `404 Not Found` - Usuario nao possui carteirinha

### GET `/member-cards/:id` (Admin)
Retorna uma carteirinha especifica com dados do usuario.

**Acesso:** Apenas ADMIN

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "matricula": 1234,
  "photo": "https://...",
  "qrCode": "uuid",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "user": {
    "id": "uuid",
    "name": "Joao Silva",
    "email": "joao@cristofoli.com.br",
    "role": "COLLABORATOR"
  }
}
```

**Erros:**
- `404 Not Found` - Carteirinha nao encontrada

### PATCH `/member-cards/:id` (Admin)
Atualiza uma carteirinha.

**Acesso:** Apenas ADMIN

**Body:**
```json
{
  "matricula": 5678,
  "photo": "https://cloudinary.com/nova-foto"
}
```

**Erros:**
- `400 Bad Request` - Matricula ja existe (se alterada)
- `404 Not Found` - Carteirinha nao encontrada

### DELETE `/member-cards/:id` (Admin)
Remove uma carteirinha.

**Acesso:** Apenas ADMIN

**Erros:**
- `404 Not Found` - Carteirinha nao encontrada

## Regras de Negocio

1. **Relacao 1:1 com Usuario:** Cada usuario pode ter no maximo uma carteirinha. Tentativa de criar segunda carteirinha retorna erro.

2. **Matricula Unica:** O numero de matricula deve ser unico no sistema e estar entre 1 e 9999.

3. **Restricao de Role:** Apenas usuarios com role `COLLABORATOR` ou `ADMIN` podem ter carteirinhas. Usuarios `DISPLAY` nao podem.

4. **QR Code Automatico:** O campo `qrCode` e gerado automaticamente como UUID na criacao e nao pode ser alterado.

5. **Cascade Delete:** Se o usuario for deletado, a carteirinha e removida automaticamente (definido no Prisma).

## DTOs

### CreateMemberCardDto

```typescript
class CreateMemberCardDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsInt()
  @Min(1)
  @Max(9999)
  matricula: number;

  @IsOptional()
  @IsUrl()
  photo?: string;
}
```

### UpdateMemberCardDto

```typescript
class UpdateMemberCardDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999)
  matricula?: number;

  @IsOptional()
  @IsUrl()
  photo?: string;
}
```

## Metodos do Service

### create(createMemberCardDto)
Cria carteirinha. Valida unicidade de userId e matricula, e verifica role do usuario.

### findAll()
Lista todas as carteirinhas com dados do usuario (exceto campos sensiveis).

### findById(id)
Busca por ID com dados do usuario. Lanca `NotFoundException` se nao encontrar.

### findByUserId(userId)
Busca carteirinha pelo ID do usuario. Retorna `null` se nao encontrar.

### update(id, updateMemberCardDto)
Atualiza carteirinha. Verifica unicidade de matricula se alterada.

### remove(id)
Remove carteirinha. Lanca `NotFoundException` se nao encontrar.

## Guards Aplicados

- `JwtAuthGuard` - Em todo o controller
- `RolesGuard` + `@Roles(Role.ADMIN)` - Em endpoints administrativos (todos exceto `/my`)

## Respostas de Erro

| Codigo | Mensagem | Causa |
|--------|----------|-------|
| 400 | "User already has a member card" | Usuario ja possui carteirinha |
| 400 | "Matricula already exists" | Numero de matricula duplicado |
| 400 | "DISPLAY users cannot have member cards" | Tentativa de criar carteirinha para usuario DISPLAY |
| 404 | "User not found" | Usuario informado nao existe |
| 404 | "Member card not found" | Carteirinha nao encontrada |
