---
module: mensagens
document: spec
status: complete
priority: mvp
last_updated: 2026-01-11
---

# Mensagens - Especificação

[← Voltar ao Módulo](README.md)

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Modelo de Dados](#2-modelo-de-dados)
3. [Telas](#3-telas)
4. [Fluxos](#4-fluxos)
5. [Componentes](#5-componentes)
6. [Real-time](#6-real-time)
7. [Offline](#7-offline)
8. [Notificações](#8-notificações)

---

## 1. Visão Geral

### Objetivo

Sistema de mensagens para comunicação direta entre membros da associação, suportando conversas 1:1 e grupos.

### Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| Chat 1:1 | Conversa privada entre dois usuários |
| Grupos | Conversa com múltiplos participantes |
| Texto | Mensagens de texto (sem limite prático) |
| Imagens | Envio de fotos da galeria ou câmera |
| Áudio | Gravação e envio de mensagens de voz |
| Reações | Reagir a mensagens com emoji |
| Respostas | Responder mensagem específica |
| Status | Online, offline, digitando, lido |

### Restrições

- Vídeos e arquivos não são suportados (apenas texto, imagem, áudio)
- Mensagens não expiram (retenção permanente)
- Não há integração com sistema de pontos

---

## 2. Modelo de Dados

### Conversation

```typescript
interface Conversation {
  id: string;                    // UUID
  type: "direct" | "group";      // Tipo de conversa
  participants: string[];        // IDs dos participantes
  created_at: string;            // ISO 8601
  updated_at: string;            // ISO 8601
  last_message?: Message;        // Última mensagem
  unread_count: number;          // Mensagens não lidas
}
```

### Message

```typescript
interface Message {
  id: string;                    // UUID
  conversation_id: string;       // UUID da conversa
  sender_id: string;             // UUID do remetente
  content: string;               // Conteúdo da mensagem
  content_type: "text" | "image" | "audio";
  media_url?: string;            // URL da mídia (se aplicável)
  reply_to?: string;             // UUID da mensagem respondida
  reactions: Reaction[];         // Reações à mensagem
  status: "sending" | "sent" | "delivered" | "read";
  created_at: string;            // ISO 8601
  deleted_at?: string;           // Soft delete
}
```

### Group

```typescript
interface Group {
  id: string;                    // UUID
  conversation_id: string;       // UUID da conversa
  name: string;                  // Nome do grupo
  description?: string;          // Descrição opcional
  image_url?: string;            // Foto do grupo
  created_by: string;            // UUID do criador
  admins: string[];              // UUIDs dos administradores
  participants: string[];        // UUIDs dos membros
  created_at: string;            // ISO 8601
}
```

### Reaction

```typescript
interface Reaction {
  user_id: string;               // UUID do usuário
  emoji: string;                 // Emoji utilizado
  created_at: string;            // ISO 8601
}
```

### UserConversationSettings

```typescript
interface UserConversationSettings {
  user_id: string;               // UUID do usuário
  conversation_id: string;       // UUID da conversa
  is_muted: boolean;             // Conversa silenciada
  is_archived: boolean;          // Conversa arquivada
  notifications: {
    push: boolean;               // Push notifications
    sound: boolean;              // Som de notificação
  };
}
```

---

## 3. Telas

### 3.1 Lista de Conversas

**Rota:** `/messages`

**Descrição:** Tela principal com todas as conversas do usuário (1:1 e grupos misturados).

**Layout:**
```
┌─────────────────────────────────────┐
│  🔍 Buscar conversas...             │
├─────────────────────────────────────┤
│  ┌────┐ João Silva          14:30   │
│  │ 👤 │ Você: Ok, combinado!    🔵2 │
│  └────┘                             │
├─────────────────────────────────────┤
│  ┌────┐ Grupo Corrida        Ontem  │
│  │ 👥 │ Maria: Vamos às 6h?         │
│  └────┘                             │
├─────────────────────────────────────┤
│  ┌────┐ Ana Costa           Seg     │
│  │ 👤 │ 🎤 Mensagem de voz          │
│  └────┘                             │
└─────────────────────────────────────┘
│         [+] Nova conversa           │
└─────────────────────────────────────┘
```

**Elementos:**
- Campo de busca no topo
- Lista ordenada por última mensagem
- Avatar do contato/grupo
- Nome do contato/grupo
- Preview da última mensagem
- Timestamp
- Badge de não lidas (se houver)
- FAB para nova conversa

**Comportamentos:**
- Pull-to-refresh
- Scroll infinito (se muitas conversas)
- Tap: abre conversa
- Long press: opções (silenciar, arquivar, excluir)

---

### 3.2 Tela de Chat

**Rota:** `/messages/:conversationId`

**Descrição:** Tela de conversa com histórico de mensagens.

**Layout:**
```
┌─────────────────────────────────────┐
│  ← │ 👤 João Silva        ● online  │
├─────────────────────────────────────┤
│                                     │
│        ┌─────────────────┐          │
│        │ Oi, tudo bem?   │ 14:25    │
│        └─────────────────┘          │
│                                     │
│  ┌─────────────────┐                │
│  │ Tudo sim!       │ 14:26 ✓✓       │
│  └─────────────────┘                │
│                                     │
│        ┌─────────────────┐          │
│        │ Vamos ao evento │ 14:27    │
│        │ sábado?         │          │
│        └─────────────────┘          │
│                 😀 👍               │
│                                     │
│  ┌─────────────────┐                │
│  │ 🎤 0:15 ▶      │ 14:28 ✓        │
│  └─────────────────┘                │
│                                     │
│                    digitando...     │
├─────────────────────────────────────┤
│  📷  🎤  │ Mensagem...     │  ➤    │
└─────────────────────────────────────┘
```

**Header:**
- Botão voltar
- Avatar do contato/grupo
- Nome
- Status (online/offline/digitando)
- Tap: abre perfil/info do grupo

**Área de Mensagens:**
- Scroll infinito para histórico
- Mensagens enviadas à direita (azul)
- Mensagens recebidas à esquerda (cinza)
- Timestamp por mensagem
- Status de leitura (✓ enviado, ✓✓ lido)
- Reações abaixo da mensagem
- Mensagem de voz com player

**Input:**
- Botão câmera/galeria
- Botão gravar áudio (hold to record)
- Campo de texto
- Botão enviar

**Comportamentos:**
- Long press na mensagem: menu (responder, reagir, copiar, deletar)
- Swipe para responder
- Scroll automático para novas mensagens
- Indicador "digitando..." em tempo real

---

### 3.3 Perfil do Contato

**Rota:** `/messages/:conversationId/profile`

**Descrição:** Informações do contato e opções da conversa.

**Layout:**
```
┌─────────────────────────────────────┐
│  ←              Contato             │
├─────────────────────────────────────┤
│                                     │
│              ┌──────┐               │
│              │  👤  │               │
│              └──────┘               │
│           João Silva                │
│           @joaosilva                │
│                                     │
│  [Ver Perfil Completo]              │
│                                     │
├─────────────────────────────────────┤
│  📷 Mídia compartilhada        (12) │
├─────────────────────────────────────┤
│  🔔 Notificações              [ON]  │
│  🔇 Silenciar conversa        [OFF] │
│  📁 Arquivar conversa               │
├─────────────────────────────────────┤
│  🚫 Bloquear usuário                │
│  ⚠️ Denunciar                       │
└─────────────────────────────────────┘
```

---

### 3.4 Info do Grupo

**Rota:** `/messages/:conversationId/group`

**Descrição:** Informações e gerenciamento do grupo.

**Layout:**
```
┌─────────────────────────────────────┐
│  ←              Grupo               │
├─────────────────────────────────────┤
│                                     │
│              ┌──────┐               │
│              │  👥  │               │
│              └──────┘               │
│         Grupo Corrida               │
│     Corredores da associação        │
│                                     │
│  [Editar] (se admin)                │
│                                     │
├─────────────────────────────────────┤
│  📷 Mídia compartilhada        (28) │
├─────────────────────────────────────┤
│  👥 12 participantes                │
│  ├─ João Silva (admin)              │
│  ├─ Maria Santos                    │
│  ├─ Ana Costa                       │
│  └─ + 9 outros...                   │
│                                     │
│  [Adicionar participante]           │
├─────────────────────────────────────┤
│  🔔 Notificações              [ON]  │
│  🔇 Silenciar grupo           [OFF] │
├─────────────────────────────────────┤
│  🚪 Sair do grupo                   │
└─────────────────────────────────────┘
```

---

### 3.5 Nova Conversa

**Rota:** `/messages/new`

**Descrição:** Iniciar nova conversa ou criar grupo.

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Nova Conversa                    │
├─────────────────────────────────────┤
│  🔍 Buscar usuário...               │
├─────────────────────────────────────┤
│  [👥 Criar grupo]                   │
├─────────────────────────────────────┤
│  Sugestões                          │
│  ├─ 👤 João Silva                   │
│  ├─ 👤 Maria Santos                 │
│  └─ 👤 Ana Costa                    │
├─────────────────────────────────────┤
│  Recentes                           │
│  ├─ 👤 Pedro Lima                   │
│  └─ 👤 Carla Dias                   │
└─────────────────────────────────────┘
```

---

### 3.6 Criar Grupo

**Rota:** `/messages/new/group`

**Descrição:** Criar novo grupo.

**Etapas:**

1. **Selecionar participantes:**
```
┌─────────────────────────────────────┐
│  ← Novo Grupo                       │
├─────────────────────────────────────┤
│  🔍 Buscar usuário...               │
├─────────────────────────────────────┤
│  Selecionados (3)                   │
│  [👤 João] [👤 Maria] [👤 Ana]      │
├─────────────────────────────────────┤
│  Contatos                           │
│  ├─ ☑ João Silva                    │
│  ├─ ☑ Maria Santos                  │
│  ├─ ☑ Ana Costa                     │
│  └─ ☐ Pedro Lima                    │
└─────────────────────────────────────┘
│              [Próximo →]            │
└─────────────────────────────────────┘
```

2. **Definir nome e foto:**
```
┌─────────────────────────────────────┐
│  ← Novo Grupo                       │
├─────────────────────────────────────┤
│                                     │
│              ┌──────┐               │
│              │  📷  │               │
│              └──────┘               │
│         Adicionar foto              │
│                                     │
│  Nome do grupo                      │
│  ┌─────────────────────────────────┐│
│  │ Grupo Corrida                   ││
│  └─────────────────────────────────┘│
│                                     │
│  Descrição (opcional)               │
│  ┌─────────────────────────────────┐│
│  │ Corredores da associação        ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
│              [Criar Grupo]          │
└─────────────────────────────────────┘
```

---

## 4. Fluxos

### 4.1 Enviar Mensagem de Texto

```
┌─────────────────────────────────────────────────────────────┐
│                 ENVIAR MENSAGEM DE TEXTO                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Usuário digita mensagem                                 │
│     └─ Campo de input ativo                                 │
│                                                             │
│  2. Usuário toca em enviar                                  │
│     └─ Mensagem aparece com status "enviando" (⏳)          │
│                                                             │
│  3. App envia via WebSocket                                 │
│     └─ POST /messages + WS broadcast                        │
│                                                             │
│  4. Servidor confirma                                       │
│     └─ Status muda para "enviado" (✓)                       │
│                                                             │
│  5. Destinatário recebe                                     │
│     └─ Status muda para "entregue" (✓✓ cinza)              │
│                                                             │
│  6. Destinatário lê                                         │
│     └─ Status muda para "lido" (✓✓ azul)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Gravar Áudio

```
┌─────────────────────────────────────────────────────────────┐
│                    GRAVAR MENSAGEM DE VOZ                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Usuário segura botão de microfone                       │
│     └─ Inicia gravação                                      │
│     └─ Feedback visual (onda sonora, timer)                 │
│                                                             │
│  2. Usuário solta botão                                     │
│     └─ Para gravação                                        │
│     └─ Preview do áudio (opcional play)                     │
│                                                             │
│  3. Usuário confirma envio                                  │
│     └─ Upload do áudio                                      │
│     └─ Mensagem com player inline                           │
│                                                             │
│  Alternativa: Deslizar para cancelar                        │
│     └─ Cancela gravação sem enviar                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Criar Grupo

```
┌─────────────────────────────────────────────────────────────┐
│                       CRIAR GRUPO                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Toca em "Nova conversa"                                 │
│     └─ Abre tela de seleção                                 │
│                                                             │
│  2. Toca em "Criar grupo"                                   │
│     └─ Abre seleção de participantes                        │
│                                                             │
│  3. Seleciona participantes (mín. 2)                        │
│     └─ Chips dos selecionados no topo                       │
│                                                             │
│  4. Toca em "Próximo"                                       │
│     └─ Abre tela de configuração                            │
│                                                             │
│  5. Define nome (obrigatório)                               │
│     └─ Foto e descrição opcionais                           │
│                                                             │
│  6. Toca em "Criar Grupo"                                   │
│     └─ POST /conversations (type: group)                    │
│     └─ Redireciona para chat do grupo                       │
│     └─ Participantes recebem notificação                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Componentes

### MessageBubble

```
Props:
- message: Message
- isOwn: boolean
- showAvatar: boolean (grupos)
- onLongPress: () => void
- onReply: () => void
- onReact: (emoji) => void
```

### ConversationListItem

```
Props:
- conversation: Conversation
- onPress: () => void
- onLongPress: () => void
```

### AudioPlayer

```
Props:
- audioUrl: string
- duration: number
- onPlay: () => void
- onPause: () => void
```

### MediaPicker

```
Props:
- onSelectImage: (file) => void
- onRecordAudio: (file) => void
```

### TypingIndicator

```
Props:
- users: User[] // Quem está digitando
```

---

## 6. Real-time

### WebSocket

**Conexão:** `wss://api.ahub.com.br/v1/ws/messages`

**Autenticação:** Token JWT no handshake

### Eventos

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `message.new` | Server → Client | Nova mensagem recebida |
| `message.delivered` | Server → Client | Mensagem entregue |
| `message.read` | Server → Client | Mensagem lida |
| `typing.start` | Client → Server | Usuário começou a digitar |
| `typing.stop` | Client → Server | Usuário parou de digitar |
| `typing.update` | Server → Client | Alguém está digitando |
| `presence.update` | Server → Client | Status online/offline |

### Payloads

**message.new:**
```json
{
  "event": "message.new",
  "data": {
    "conversation_id": "uuid",
    "message": { ... }
  }
}
```

**typing.update:**
```json
{
  "event": "typing.update",
  "data": {
    "conversation_id": "uuid",
    "user_id": "uuid",
    "is_typing": true
  }
}
```

---

## 7. Offline

### Cache Local

| Dado | Estratégia |
|------|------------|
| Lista de conversas | Cache completo |
| Últimas 50 mensagens/conversa | Cache |
| Mídia | Cache on-demand |

### Comportamentos

- **Leitura:** Funciona offline (dados cacheados)
- **Envio:** Não funciona offline (requer conexão)
- **Indicador:** Banner "Sem conexão" quando offline

### Sincronização

Ao reconectar:
1. Sync de novas mensagens
2. Atualização de status (lido/entregue)
3. Download de mídia pendente

---

## 8. Notificações

### Tipos

| Tipo | Trigger | Configurável |
|------|---------|--------------|
| Nova mensagem | Receber mensagem (não silenciada) | Sim |
| Menção em grupo | Ser mencionado (@usuario) | Sim |

### Configurações por Usuário

```typescript
interface NotificationSettings {
  messages: {
    push: boolean;      // Push notifications
    sound: boolean;     // Som ao receber
    vibrate: boolean;   // Vibração
  };
  mentions: {
    push: boolean;
    sound: boolean;
  };
}
```

### Configurações por Conversa

- Silenciar: desativa todas as notificações
- Duração: Permanente, 1h, 8h, 1 dia, 1 semana

---

## Relacionados

- [API](api.md) - Endpoints
- [Critérios de Aceitação](acceptance-criteria.md) - Checklist
- [Notificações](../07-notificacoes/) - Sistema de push
- [Perfil](../02-perfil/) - Integração com perfil
