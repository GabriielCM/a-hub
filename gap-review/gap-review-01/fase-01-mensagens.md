---
gap-review: 01
fase: 01
nome: mensagens
status: concluido
created_at: 2026-01-11
completed_at: 2026-01-11
---

# Fase 01 - Módulo Mensagens

[← Voltar ao Review](README.md)

---

## Objetivo

Especificar completamente o módulo 08-mensagens através do processo de descoberta com 20 perguntas.

---

## Resumo das Decisões (20 Perguntas)

### Categoria 1: Visão e Propósito

| Pergunta | Decisão |
|----------|---------|
| Objetivo principal | **Chat 1:1 e Grupos** |
| Usuários-alvo | **Todos os usuários** (Common User + ADM) |
| Problema que resolve | **Comunicação direta + Networking** |
| Integração no app | **Menu + Perfil** (botão "Enviar mensagem") |

### Categoria 2: Funcionalidades Core

| Pergunta | Decisão |
|----------|---------|
| Tipos de conteúdo | **Texto + Imagens + Áudio** (sem vídeos/arquivos) |
| Ações nas mensagens | **Intermediário** (enviar, visualizar, deletar, responder, reagir com emoji) |
| Funcionamento de grupos | **Qualquer um cria** grupos livremente |
| Estados da interface | **Com status** (online/offline, digitando, lido) |

### Categoria 3: Integrações

| Pergunta | Decisão |
|----------|---------|
| Dependências | **Perfil + Notificações + Eventos** |
| Módulos dependentes | **Nenhum** (módulo independente) |
| Notificações | **Configurável** pelo usuário |
| Sistema de pontos | **Não integra** |

### Categoria 4: Experiência e Interface

| Pergunta | Decisão |
|----------|---------|
| Componentes visuais | **Completo** (lista, chat, perfil contato, info grupo, busca) |
| Navegação | **Lista única** (1:1 e grupos juntos) |
| Comportamento offline | **Leitura offline** (mensagens cacheadas) |
| Feedback visual | **+ Status de leitura** (entregue, lido - checkmarks) |

### Categoria 5: Regras de Negócio e Técnico

| Pergunta | Decisão |
|----------|---------|
| Validações | **Básico** (limite de caracteres, tamanho de arquivo) |
| Protocolo real-time | **WebSocket** (conexão persistente) |
| Performance | **Padrão** (carregar mensagens < 2s) |
| Retenção de mensagens | **Permanente** (nunca expiram) |

---

## Issues

### Issue 1.1 - Criar spec.md

- **Módulo:** 08-mensagens
- **Arquivo:** `docs/08-mensagens/spec.md`
- **Problema:** Arquivo não existe
- **Ação:** Criar especificação completa com base nas decisões
- **Status:** [ ] Pendente

### Issue 1.2 - Criar api.md

- **Módulo:** 08-mensagens
- **Arquivo:** `docs/08-mensagens/api.md`
- **Problema:** Arquivo não existe
- **Ação:** Documentar endpoints da API
- **Status:** [ ] Pendente

### Issue 1.3 - Criar acceptance-criteria.md

- **Módulo:** 08-mensagens
- **Arquivo:** `docs/08-mensagens/acceptance-criteria.md`
- **Problema:** Arquivo não existe
- **Ação:** Criar critérios de aceitação
- **Status:** [ ] Pendente

### Issue 1.4 - Atualizar README.md

- **Módulo:** 08-mensagens
- **Arquivo:** `docs/08-mensagens/README.md`
- **Problema:** Arquivo é apenas stub
- **Ação:** Atualizar com índice e visão geral completa
- **Status:** [ ] Pendente

---

## Progresso

- [x] Issue 1.1 - Criar spec.md
- [x] Issue 1.2 - Criar api.md
- [x] Issue 1.3 - Criar acceptance-criteria.md
- [x] Issue 1.4 - Atualizar README.md

---

## Especificação Derivada

### Modelo de Dados

```
Conversation
├── id: UUID
├── type: "direct" | "group"
├── participants: User[]
├── created_at: DateTime
├── updated_at: DateTime
└── last_message: Message

Message
├── id: UUID
├── conversation_id: UUID
├── sender_id: UUID
├── content: String
├── content_type: "text" | "image" | "audio"
├── media_url: String (optional)
├── reply_to: UUID (optional)
├── reactions: Reaction[]
├── status: "sent" | "delivered" | "read"
├── created_at: DateTime
└── deleted_at: DateTime (soft delete)

Group
├── id: UUID
├── conversation_id: UUID
├── name: String
├── description: String (optional)
├── image_url: String (optional)
├── created_by: UUID
├── admins: UUID[]
└── created_at: DateTime

Reaction
├── user_id: UUID
├── emoji: String
└── created_at: DateTime

UserConversationSettings
├── user_id: UUID
├── conversation_id: UUID
├── is_muted: Boolean
├── is_archived: Boolean
└── notification_settings: Object
```

### Telas Principais

1. **Lista de Conversas**
   - Lista única com 1:1 e grupos
   - Avatar, nome, última mensagem, hora
   - Badge de não lidas
   - Busca de conversas

2. **Tela de Chat**
   - Header com nome/foto do contato ou grupo
   - Lista de mensagens (scroll infinito para histórico)
   - Input de texto + botões de mídia
   - Status de digitando
   - Status de leitura (✓ ✓✓)

3. **Perfil do Contato**
   - Foto, nome, bio
   - Mídia compartilhada
   - Opções (silenciar, bloquear, denunciar)

4. **Info do Grupo**
   - Nome, descrição, foto
   - Lista de participantes
   - Mídia compartilhada
   - Opções de grupo (sair, silenciar)

5. **Nova Conversa**
   - Busca de usuários
   - Criar grupo (nome, foto, participantes)

### Endpoints Principais

```
# Conversas
GET    /v1/conversations                    # Listar conversas
POST   /v1/conversations                    # Criar conversa/grupo
GET    /v1/conversations/:id                # Detalhes da conversa
DELETE /v1/conversations/:id                # Sair/deletar conversa

# Mensagens
GET    /v1/conversations/:id/messages       # Listar mensagens (paginado)
POST   /v1/conversations/:id/messages       # Enviar mensagem
DELETE /v1/messages/:id                     # Deletar mensagem
POST   /v1/messages/:id/reactions           # Reagir com emoji
DELETE /v1/messages/:id/reactions/:emoji    # Remover reação

# Status
POST   /v1/conversations/:id/read           # Marcar como lido
POST   /v1/conversations/:id/typing         # Indicar digitando

# Configurações
PUT    /v1/conversations/:id/settings       # Silenciar, arquivar

# WebSocket
WS     /v1/ws/messages                      # Conexão real-time
```

---

## Notas

- WebSocket para mensagens em tempo real
- Cache local para leitura offline
- Mensagens nunca expiram (retenção permanente)
- Sem integração com sistema de pontos
- Notificações configuráveis pelo usuário

---

## Relacionados

- [Análise Macro](00-analise-macro.md)
- [Módulo Mensagens](../../docs/08-mensagens/)
- [Notificações](../../docs/07-notificacoes/)
