# Modulo: Users (Backend)

**Localização:** `apps/backend/src/users/`

## Visão Geral

Gerenciamento de usuários do sistema. CRUD completo com controle de acesso por roles.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `users.module.ts` | Configuração do módulo NestJS |
| `users.service.ts` | Lógica de negócio |
| `users.controller.ts` | Endpoints REST |
| `dto/create-user.dto.ts` | DTO para criação |
| `dto/update-user.dto.ts` | DTO para atualização |

## Modelo de Dados

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String
  name         String
  role         Role      @default(COLLABORATOR)
  refreshToken String?
  bookings     Booking[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum Role {
  COLLABORATOR
  ADMIN
  DISPLAY
}
```

## Endpoints

Todos os endpoints requerem `JwtAuthGuard`.

### GET `/users/me`
Retorna dados do usuário autenticado (sem password/refreshToken).

**Acesso:** Qualquer usuário autenticado

### GET `/users`
Lista todos os usuários.

**Acesso:** Apenas ADMIN

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "role": "COLLABORATOR|ADMIN|DISPLAY",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
]
```

### GET `/users/:id`
Retorna um usuário específico.

**Acesso:** Apenas ADMIN

### PATCH `/users/:id`
Atualiza dados do usuário.

**Acesso:** Apenas ADMIN

**Body:**
```json
{
  "name": "string (opcional)",
  "role": "COLLABORATOR|ADMIN|DISPLAY (opcional)"
}
```

### DELETE `/users/:id`
Remove um usuário e seus bookings (cascade).

**Acesso:** Apenas ADMIN

## Métodos do Service

### create(createUserDto)
Cria usuário. Usado internamente pelo AuthService no registro.

### findAll()
Lista usuários (sem campos sensíveis).

### findById(id)
Busca por ID. Lança `NotFoundException` se não encontrar.

### findByEmail(email)
Busca por email. Retorna `null` se não encontrar.

### update(id, updateUserDto)
Atualiza usuário. Retorna sem campos sensíveis.

### remove(id)
Remove usuário. Bookings são deletados em cascade (definido no Prisma).

### updateRefreshToken(id, refreshToken)
Atualiza refresh token (hashado). Usado pelo AuthService.

## Campos Sensíveis

Campos `password` e `refreshToken` são omitidos nas respostas da API usando destructuring:

```typescript
const { password: _, refreshToken: __, ...userWithoutSensitive } = user;
```

## Guards Aplicados

- `JwtAuthGuard` - Em todo o controller
- `RolesGuard` + `@Roles(Role.ADMIN)` - Em endpoints administrativos
