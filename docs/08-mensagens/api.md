---
module: mensagens
document: api
status: complete
priority: mvp
last_updated: 2026-01-11
---

# Mensagens - API

[← Voltar ao Módulo](README.md)

---

## Índice

1. [Conversas](#1-conversas)
2. [Mensagens](#2-mensagens)
3. [Grupos](#3-grupos)
4. [WebSocket](#4-websocket)
5. [Códigos de Erro](#5-códigos-de-erro)

---

## Base URL

```
Produção: https://api.ahub.com.br/v1
Staging:  https://api-staging.ahub.com.br/v1
```

**Autenticação:** Bearer Token (JWT)

---

## 1. Conversas

### GET /v1/conversations

Lista todas as conversas do usuário.

**Query Params:**

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `limit` | Number | Não | Limite de resultados (default: 20) |
| `offset` | Number | Não | Offset para paginação |
| `archived` | Boolean | Não | Incluir arquivadas (default: false) |

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "direct",
      "participants": [
        {
          "id": "uuid",
          "name": "João Silva",
          "avatar_url": "https://..."
        }
      ],
      "last_message": {
        "id": "uuid",
        "content": "Ok, combinado!",
        "content_type": "text",
        "sender_id": "uuid",
        "created_at": "2026-01-11T14:30:00Z"
      },
      "unread_count": 2,
      "is_muted": false,
      "updated_at": "2026-01-11T14:30:00Z"
    },
    {
      "id": "uuid",
      "type": "group",
      "group": {
        "id": "uuid",
        "name": "Grupo Corrida",
        "image_url": "https://...",
        "participants_count": 12
      },
      "last_message": {
        "id": "uuid",
        "content": "Vamos às 6h?",
        "content_type": "text",
        "sender_id": "uuid",
        "sender_name": "Maria",
        "created_at": "2026-01-10T18:00:00Z"
      },
      "unread_count": 0,
      "is_muted": false,
      "updated_at": "2026-01-10T18:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

---

### POST /v1/conversations

Cria uma nova conversa (direta ou grupo).

**Request Body (Conversa Direta):**

```json
{
  "type": "direct",
  "participant_id": "uuid"
}
```

**Request Body (Grupo):**

```json
{
  "type": "group",
  "name": "Grupo Corrida",
  "description": "Corredores da associação",
  "image_url": "https://...",
  "participant_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response 201:**

```json
{
  "data": {
    "id": "uuid",
    "type": "group",
    "group": {
      "id": "uuid",
      "name": "Grupo Corrida",
      "description": "Corredores da associação",
      "image_url": "https://...",
      "created_by": "uuid",
      "admins": ["uuid"],
      "participants_count": 4
    },
    "created_at": "2026-01-11T10:00:00Z"
  }
}
```

**Response 409 (Conversa já existe):**

```json
{
  "data": {
    "id": "existing-uuid",
    "message": "Conversa já existe"
  }
}
```

---

### GET /v1/conversations/:id

Retorna detalhes de uma conversa.

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "type": "direct",
    "participants": [
      {
        "id": "uuid",
        "name": "João Silva",
        "avatar_url": "https://...",
        "is_online": true,
        "last_seen": "2026-01-11T14:30:00Z"
      }
    ],
    "settings": {
      "is_muted": false,
      "muted_until": null,
      "is_archived": false,
      "notifications": {
        "push": true,
        "sound": true
      }
    },
    "media_count": 12,
    "created_at": "2026-01-01T10:00:00Z"
  }
}
```

---

### PUT /v1/conversations/:id/settings

Atualiza configurações da conversa.

**Request Body:**

```json
{
  "is_muted": true,
  "muted_until": "2026-01-12T10:00:00Z",
  "is_archived": false,
  "notifications": {
    "push": true,
    "sound": false
  }
}
```

**Response 200:**

```json
{
  "data": {
    "settings": {
      "is_muted": true,
      "muted_until": "2026-01-12T10:00:00Z",
      "is_archived": false,
      "notifications": {
        "push": true,
        "sound": false
      }
    }
  }
}
```

---

### DELETE /v1/conversations/:id

Sai da conversa (grupo) ou deleta (direta).

**Response 200:**

```json
{
  "data": {
    "deleted": true
  }
}
```

---

## 2. Mensagens

### GET /v1/conversations/:id/messages

Lista mensagens de uma conversa.

**Query Params:**

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `limit` | Number | Não | Limite (default: 50) |
| `before` | String | Não | Mensagens antes deste ID |
| `after` | String | Não | Mensagens após este ID |

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender": {
        "id": "uuid",
        "name": "João Silva",
        "avatar_url": "https://..."
      },
      "content": "Oi, tudo bem?",
      "content_type": "text",
      "reply_to": null,
      "reactions": [
        {
          "emoji": "👍",
          "count": 2,
          "users": ["uuid1", "uuid2"]
        }
      ],
      "status": "read",
      "created_at": "2026-01-11T14:25:00Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender": {
        "id": "my-uuid",
        "name": "Eu",
        "avatar_url": "https://..."
      },
      "content": "Tudo sim!",
      "content_type": "text",
      "status": "read",
      "created_at": "2026-01-11T14:26:00Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender": {
        "id": "my-uuid",
        "name": "Eu"
      },
      "content": null,
      "content_type": "audio",
      "media_url": "https://...",
      "media_duration": 15,
      "status": "delivered",
      "created_at": "2026-01-11T14:28:00Z"
    }
  ],
  "pagination": {
    "has_more": true,
    "oldest_id": "uuid"
  }
}
```

---

### POST /v1/conversations/:id/messages

Envia uma mensagem.

**Request Body (Texto):**

```json
{
  "content": "Olá, tudo bem?",
  "content_type": "text",
  "reply_to": null
}
```

**Request Body (Imagem):**

```json
{
  "content": null,
  "content_type": "image",
  "media_url": "https://...",
  "reply_to": null
}
```

**Request Body (Áudio):**

```json
{
  "content": null,
  "content_type": "audio",
  "media_url": "https://...",
  "media_duration": 15,
  "reply_to": null
}
```

**Response 201:**

```json
{
  "data": {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "content": "Olá, tudo bem?",
    "content_type": "text",
    "status": "sent",
    "created_at": "2026-01-11T14:30:00Z"
  }
}
```

---

### DELETE /v1/messages/:id

Deleta uma mensagem (soft delete).

**Response 200:**

```json
{
  "data": {
    "deleted": true,
    "message_id": "uuid"
  }
}
```

---

### POST /v1/messages/:id/reactions

Adiciona reação a uma mensagem.

**Request Body:**

```json
{
  "emoji": "👍"
}
```

**Response 201:**

```json
{
  "data": {
    "message_id": "uuid",
    "reaction": {
      "emoji": "👍",
      "user_id": "uuid",
      "created_at": "2026-01-11T14:30:00Z"
    }
  }
}
```

---

### DELETE /v1/messages/:id/reactions/:emoji

Remove reação de uma mensagem.

**Response 200:**

```json
{
  "data": {
    "removed": true
  }
}
```

---

### POST /v1/conversations/:id/read

Marca conversa como lida.

**Response 200:**

```json
{
  "data": {
    "conversation_id": "uuid",
    "read_at": "2026-01-11T14:30:00Z"
  }
}
```

---

### POST /v1/conversations/:id/typing

Indica que usuário está digitando.

**Request Body:**

```json
{
  "is_typing": true
}
```

**Response 200:**

```json
{
  "data": {
    "acknowledged": true
  }
}
```

---

## 3. Grupos

### GET /v1/conversations/:id/group

Retorna informações do grupo.

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "name": "Grupo Corrida",
    "description": "Corredores da associação",
    "image_url": "https://...",
    "created_by": {
      "id": "uuid",
      "name": "João Silva"
    },
    "admins": [
      {
        "id": "uuid",
        "name": "João Silva",
        "avatar_url": "https://..."
      }
    ],
    "participants": [
      {
        "id": "uuid",
        "name": "Maria Santos",
        "avatar_url": "https://...",
        "is_admin": false,
        "joined_at": "2026-01-01T10:00:00Z"
      }
    ],
    "participants_count": 12,
    "media_count": 28,
    "created_at": "2026-01-01T10:00:00Z"
  }
}
```

---

### PUT /v1/conversations/:id/group

Atualiza informações do grupo (apenas admins).

**Request Body:**

```json
{
  "name": "Grupo Corrida Matinal",
  "description": "Corredores que treinam de manhã",
  "image_url": "https://..."
}
```

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "name": "Grupo Corrida Matinal",
    "description": "Corredores que treinam de manhã",
    "image_url": "https://...",
    "updated_at": "2026-01-11T10:00:00Z"
  }
}
```

---

### POST /v1/conversations/:id/group/participants

Adiciona participantes ao grupo.

**Request Body:**

```json
{
  "user_ids": ["uuid1", "uuid2"]
}
```

**Response 201:**

```json
{
  "data": {
    "added": 2,
    "participants_count": 14
  }
}
```

---

### DELETE /v1/conversations/:id/group/participants/:userId

Remove participante do grupo (apenas admins).

**Response 200:**

```json
{
  "data": {
    "removed": true,
    "user_id": "uuid"
  }
}
```

---

### POST /v1/conversations/:id/group/admins

Promove participante a admin.

**Request Body:**

```json
{
  "user_id": "uuid"
}
```

**Response 200:**

```json
{
  "data": {
    "promoted": true,
    "user_id": "uuid"
  }
}
```

---

## 4. WebSocket

### Conexão

```
wss://api.ahub.com.br/v1/ws/messages
```

**Headers:**

```
Authorization: Bearer <token>
```

### Eventos do Servidor

#### message.new

Nova mensagem recebida.

```json
{
  "event": "message.new",
  "data": {
    "conversation_id": "uuid",
    "message": {
      "id": "uuid",
      "sender": {
        "id": "uuid",
        "name": "João Silva"
      },
      "content": "Olá!",
      "content_type": "text",
      "created_at": "2026-01-11T14:30:00Z"
    }
  }
}
```

#### message.delivered

Mensagem foi entregue.

```json
{
  "event": "message.delivered",
  "data": {
    "message_id": "uuid",
    "delivered_to": "uuid",
    "delivered_at": "2026-01-11T14:30:01Z"
  }
}
```

#### message.read

Mensagem foi lida.

```json
{
  "event": "message.read",
  "data": {
    "conversation_id": "uuid",
    "read_by": "uuid",
    "read_at": "2026-01-11T14:30:05Z"
  }
}
```

#### typing.update

Alguém está digitando.

```json
{
  "event": "typing.update",
  "data": {
    "conversation_id": "uuid",
    "user": {
      "id": "uuid",
      "name": "João Silva"
    },
    "is_typing": true
  }
}
```

#### presence.update

Status de presença.

```json
{
  "event": "presence.update",
  "data": {
    "user_id": "uuid",
    "is_online": true,
    "last_seen": "2026-01-11T14:30:00Z"
  }
}
```

### Eventos do Cliente

#### typing.start

Começou a digitar.

```json
{
  "event": "typing.start",
  "data": {
    "conversation_id": "uuid"
  }
}
```

#### typing.stop

Parou de digitar.

```json
{
  "event": "typing.stop",
  "data": {
    "conversation_id": "uuid"
  }
}
```

---

## 5. Códigos de Erro

| Código | HTTP | Descrição |
|--------|------|-----------|
| `CONVERSATION_NOT_FOUND` | 404 | Conversa não encontrada |
| `MESSAGE_NOT_FOUND` | 404 | Mensagem não encontrada |
| `NOT_PARTICIPANT` | 403 | Usuário não é participante |
| `NOT_ADMIN` | 403 | Usuário não é admin do grupo |
| `CANNOT_MESSAGE_SELF` | 400 | Não pode enviar mensagem para si mesmo |
| `USER_BLOCKED` | 403 | Usuário está bloqueado |
| `GROUP_FULL` | 400 | Grupo atingiu limite de participantes |
| `INVALID_MEDIA_TYPE` | 400 | Tipo de mídia não suportado |
| `MEDIA_TOO_LARGE` | 400 | Arquivo muito grande |

---

## Relacionados

- [Especificação](spec.md) - Funcionalidades e telas
- [Critérios de Aceitação](acceptance-criteria.md) - Checklist
- [Notificações - API](../07-notificacoes/api.md) - Push notifications
