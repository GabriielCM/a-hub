# Modulo: Auth (Backend)

**Localização:** `apps/backend/src/auth/`

## Visão Geral

Módulo de autenticação usando JWT com estratégia de access token + refresh token.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `auth.module.ts` | Configuração do módulo NestJS |
| `auth.service.ts` | Lógica de autenticação |
| `auth.controller.ts` | Endpoints REST |
| `dto/login.dto.ts` | DTO para login |
| `dto/register.dto.ts` | DTO para registro |
| `guards/jwt-auth.guard.ts` | Guard para validar access token |
| `guards/jwt-refresh.guard.ts` | Guard para validar refresh token |
| `strategies/jwt.strategy.ts` | Estratégia Passport para JWT |
| `strategies/jwt-refresh.strategy.ts` | Estratégia para refresh token |

## Endpoints

### POST `/auth/register`
Registro de novo usuário.

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": { "id", "name", "email", "role" }
}
```

### POST `/auth/login`
Login de usuário existente.

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

### POST `/auth/logout`
Logout - invalida refresh token. Requer `JwtAuthGuard`.

### POST `/auth/refresh`
Renova tokens usando refresh token. Requer `JwtRefreshGuard`.

**Response:**
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

## Fluxo de Autenticação

1. **Login/Register:** Gera access token (curta duração) e refresh token (7d)
2. **Refresh token** é hashado com bcrypt e salvo no banco (campo `User.refreshToken`)
3. **Access token** carrega payload: `{ sub: userId, email, role }`
4. **Renovação:** Frontend usa refresh token para obter novos tokens quando access expira
5. **Logout:** Remove refresh token do banco

## Variáveis de Ambiente

```env
JWT_SECRET=          # Secret para assinar access tokens
JWT_EXPIRATION=15m   # Expiração do access token (padrão: 15m)
JWT_REFRESH_SECRET=  # Secret para assinar refresh tokens
JWT_REFRESH_EXPIRATION=7d  # Expiração do refresh token (padrão: 7d)
```

## Guards Disponíveis

### JwtAuthGuard
Valida access token no header `Authorization: Bearer <token>`.

```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
getProtected(@CurrentUser('sub') userId: string) {}
```

### JwtRefreshGuard
Valida refresh token. Usado apenas no endpoint `/auth/refresh`.

## Decorator @CurrentUser

Extrai dados do payload JWT:

```typescript
@CurrentUser('sub')    // userId
@CurrentUser('email')  // email do usuário
@CurrentUser('role')   // role do usuário
@CurrentUser('refreshToken')  // refresh token (apenas com JwtRefreshGuard)
```

## Dependências

- `UsersService` - Para criar/buscar usuários
- `JwtService` - Para gerar tokens
- `ConfigService` - Para ler variáveis de ambiente
- `bcrypt` - Para hash de senhas e refresh tokens
