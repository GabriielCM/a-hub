# Modulo: Bookings (Backend)

**Localização:** `apps/backend/src/bookings/`

## Visão Geral

Gerenciamento de agendamentos. Colaboradores criam reservas, admins aprovam/rejeitam.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `bookings.module.ts` | Configuração do módulo NestJS |
| `bookings.service.ts` | Lógica de negócio |
| `bookings.controller.ts` | Endpoints REST |
| `dto/create-booking.dto.ts` | DTO para criação |
| `dto/update-booking.dto.ts` | DTO para atualização de status |

## Modelo de Dados

```prisma
model Booking {
  id        String        @id @default(uuid())
  date      DateTime      @db.Date
  userId    String
  user      User          @relation(...)
  spaceId   String
  space     Space         @relation(...)
  status    BookingStatus @default(PENDING)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@unique([spaceId, date])  // Um booking por espaço por dia
  @@index([userId])
  @@index([spaceId])
  @@index([date])
}

enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

## Endpoints

Todos requerem `JwtAuthGuard`.

### POST `/bookings`
Cria novo agendamento (status: PENDING).

**Body:**
```json
{
  "date": "2025-01-15",
  "spaceId": "uuid"
}
```

**Validações:**
- Data deve ser futura (não permite hoje ou passado)
- Espaço deve existir
- Não pode haver booking PENDING ou APPROVED para mesma data/espaço

**Erros:**
- `400 BadRequest` - Data inválida
- `404 NotFound` - Espaço não encontrado
- `409 Conflict` - Data já reservada

### GET `/bookings`
Lista bookings do usuário autenticado.

### GET `/bookings/all` (Admin)
Lista todos os bookings com dados de user e space.

### GET `/bookings/export` (Admin)
Exporta todos os bookings em CSV.

**Response:** `text/csv` com headers:
```
Data,Espaço,Valor,Usuário,Email,Status
```

### GET `/bookings/:id`
Retorna detalhes de um booking.

### PATCH `/bookings/:id`
Atualiza status do booking.

**Body:**
```json
{
  "status": "APPROVED|REJECTED|CANCELLED"
}
```

**Regras de Acesso:**
- `APPROVED/REJECTED`: Apenas ADMIN
- `CANCELLED`: ADMIN ou dono do booking

### DELETE `/bookings/:id`
Remove booking.

**Acesso:** ADMIN ou dono do booking

## Métodos do Service

### create(createBookingDto, userId)
Cria booking com validações de data e disponibilidade.

### findAllByUser(userId)
Bookings do usuário com dados do space.

### findAll()
Todos os bookings com dados de space e user.

### findById(id)
Booking completo.

### updateStatus(id, updateBookingDto, userId, userRole)
Atualiza status com verificação de permissões.

### remove(id, userId, userRole)
Remove com verificação de permissões.

### exportToCsv()
Gera string CSV de todos os bookings.

## Regras de Negócio

1. **Uma reserva por dia:** Constraint `@@unique([spaceId, date])`
2. **Sem reservas passadas:** Validação no service
3. **Status inicial:** Sempre PENDING
4. **Aprovação:** Apenas admin pode aprovar/rejeitar
5. **Cancelamento:** Dono pode cancelar próprio booking
6. **Deleção em cascade:** Se user ou space for deletado, bookings são removidos

## Fluxo de Status

```
PENDING → APPROVED (admin)
PENDING → REJECTED (admin)
PENDING → CANCELLED (dono ou admin)
APPROVED → CANCELLED (admin)
```
