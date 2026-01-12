---
module: mensagens
status: complete
priority: mvp
last_updated: 2026-01-11
---

# Mensagens

[← Voltar ao Índice](../README.md)

---

**Status:** 🟢 Concluído
**Prioridade:** 🔴 MVP

---

## Visão Geral

Sistema de mensagens entre usuários da associação, suportando conversas diretas (1:1) e grupos.

### Objetivos

- Comunicação direta entre membros
- Networking entre associados
- Suporte a grupos de interesse/eventos
- Integração com perfis de usuário

---

## Índice

| Documento | Descrição |
|-----------|-----------|
| [Especificação](spec.md) | Funcionalidades, telas, fluxos |
| [API](api.md) | Endpoints REST e WebSocket |
| [Critérios de Aceitação](acceptance-criteria.md) | Checklist de validação |

---

## Funcionalidades Principais

### Conversas
- Chat 1:1 (direto entre dois usuários)
- Grupos (criados por qualquer usuário)
- Lista unificada de conversas

### Conteúdo
- Mensagens de texto
- Envio de imagens
- Mensagens de áudio

### Interações
- Responder mensagens
- Reagir com emoji
- Status de leitura (✓ ✓✓)

### Status em Tempo Real
- Online/offline
- Digitando...
- Entregue/Lido

---

## Componentes

| Componente | Descrição |
|------------|-----------|
| ConversationList | Lista de todas as conversas |
| ChatScreen | Tela de conversa |
| ContactProfile | Perfil do contato na conversa |
| GroupInfo | Informações e membros do grupo |
| NewConversation | Criar conversa/grupo |
| MessageBubble | Balão de mensagem |
| MediaPicker | Seletor de imagem/áudio |

---

## Integrações

### Depende de
- [Perfil](../02-perfil/) - Dados do usuário, botão "Enviar mensagem"
- [Notificações](../07-notificacoes/) - Push de novas mensagens
- [Eventos](../04-eventos/) - Grupos por evento (opcional)

### Outros dependem
- Nenhum módulo depende diretamente de Mensagens

---

## Decisões de Negócio

| Decisão | Valor |
|---------|-------|
| Tipos de conversa | 1:1 + Grupos |
| Quem pode criar grupos | Qualquer usuário |
| Conteúdo suportado | Texto, imagens, áudio |
| Retenção de mensagens | Permanente |
| Integração com pontos | Não |
| Notificações | Configuráveis pelo usuário |
| Protocolo real-time | WebSocket |

---

## Relacionados

- [Dashboard](../01-dashboard/)
- [Perfil do Usuário](../02-perfil/)
- [Notificações](../07-notificacoes/)
- [Eventos](../04-eventos/)
