---
module: mensagens
document: acceptance-criteria
status: complete
priority: mvp
last_updated: 2026-01-11
---

# Mensagens - Critérios de Aceitação

[← Voltar ao Módulo](README.md)

---

## Índice

1. [Lista de Conversas](#1-lista-de-conversas)
2. [Tela de Chat](#2-tela-de-chat)
3. [Envio de Mensagens](#3-envio-de-mensagens)
4. [Grupos](#4-grupos)
5. [Real-time](#5-real-time)
6. [Notificações](#6-notificações)
7. [Offline](#7-offline)
8. [Validação Final](#8-validação-final)

---

## 1. Lista de Conversas

### 1.1 Exibição

- [ ] Lista carrega em < 2 segundos
- [ ] Conversas ordenadas por última mensagem (mais recente primeiro)
- [ ] Avatar do contato/grupo é exibido
- [ ] Nome do contato/grupo é exibido
- [ ] Preview da última mensagem é exibido
- [ ] Timestamp relativo é exibido (agora, 5min, ontem, 10/01)
- [ ] Badge de não lidas é exibido (se houver)
- [ ] Conversas 1:1 e grupos são exibidos na mesma lista

### 1.2 Busca

- [ ] Campo de busca está disponível
- [ ] Busca filtra por nome do contato/grupo
- [ ] Busca filtra por conteúdo de mensagem
- [ ] Resultados aparecem em < 500ms

### 1.3 Interações

- [ ] Tap abre a conversa
- [ ] Long press exibe menu de opções
- [ ] Pull-to-refresh atualiza a lista
- [ ] FAB de nova conversa está visível

### 1.4 Menu de Opções (Long Press)

- [ ] Opção "Silenciar" funciona
- [ ] Opção "Arquivar" funciona
- [ ] Opção "Excluir" funciona
- [ ] Confirmação antes de excluir

---

## 2. Tela de Chat

### 2.1 Header

- [ ] Botão voltar funciona
- [ ] Avatar do contato/grupo é exibido
- [ ] Nome do contato/grupo é exibido
- [ ] Status online/offline é exibido (conversas diretas)
- [ ] "Digitando..." é exibido quando aplicável
- [ ] Tap no header abre perfil/info do grupo

### 2.2 Área de Mensagens

- [ ] Mensagens são carregadas corretamente
- [ ] Mensagens próprias à direita (cor diferente)
- [ ] Mensagens recebidas à esquerda
- [ ] Timestamp por mensagem
- [ ] Status de envio (✓ enviado)
- [ ] Status de leitura (✓✓ lido)
- [ ] Avatar do remetente em grupos
- [ ] Scroll infinito para histórico
- [ ] Scroll automático para novas mensagens

### 2.3 Mensagens de Mídia

- [ ] Imagens são exibidas inline (thumbnail)
- [ ] Tap em imagem abre visualização full-screen
- [ ] Mensagem de áudio exibe player
- [ ] Player de áudio funciona (play/pause)
- [ ] Duração do áudio é exibida

### 2.4 Reações

- [ ] Reações são exibidas abaixo da mensagem
- [ ] Contador de cada emoji é exibido
- [ ] Tap em reação adiciona/remove sua reação

### 2.5 Respostas

- [ ] Mensagens respondidas mostram preview
- [ ] Tap no preview scrolla para mensagem original

### 2.6 Input

- [ ] Campo de texto funciona
- [ ] Botão de enviar está disponível
- [ ] Botão de câmera/galeria funciona
- [ ] Botão de gravar áudio funciona

---

## 3. Envio de Mensagens

### 3.1 Texto

- [ ] Mensagem aparece imediatamente com status "enviando"
- [ ] Status muda para "enviado" após confirmação
- [ ] Mensagem vazia não pode ser enviada
- [ ] Limite de caracteres é respeitado (se houver)
- [ ] Emojis são suportados

### 3.2 Imagem

- [ ] Seletor de galeria abre corretamente
- [ ] Câmera abre corretamente
- [ ] Preview da imagem antes de enviar
- [ ] Upload mostra progresso
- [ ] Imagem enviada aparece na conversa

### 3.3 Áudio

- [ ] Segura botão inicia gravação
- [ ] Feedback visual durante gravação (onda, timer)
- [ ] Solta botão para gravação
- [ ] Deslizar para cancelar funciona
- [ ] Preview do áudio antes de enviar (opcional)
- [ ] Áudio enviado aparece com player

### 3.4 Resposta

- [ ] Swipe na mensagem ativa modo resposta
- [ ] Preview da mensagem respondida no input
- [ ] Botão X cancela resposta
- [ ] Mensagem enviada mostra referência

---

## 4. Grupos

### 4.1 Criar Grupo

- [ ] Botão "Criar grupo" está disponível
- [ ] Seleção de participantes funciona
- [ ] Mínimo de 2 participantes
- [ ] Nome do grupo é obrigatório
- [ ] Foto do grupo é opcional
- [ ] Descrição é opcional
- [ ] Grupo é criado corretamente
- [ ] Redireciona para chat do grupo

### 4.2 Info do Grupo

- [ ] Nome e foto do grupo são exibidos
- [ ] Descrição é exibida (se houver)
- [ ] Lista de participantes é exibida
- [ ] Admins são identificados
- [ ] Contador de mídia compartilhada

### 4.3 Gerenciamento (Admin)

- [ ] Admin pode editar nome/foto/descrição
- [ ] Admin pode adicionar participantes
- [ ] Admin pode remover participantes
- [ ] Admin pode promover outro admin

### 4.4 Participante

- [ ] Pode ver info do grupo
- [ ] Pode silenciar grupo
- [ ] Pode sair do grupo
- [ ] Confirmação antes de sair

---

## 5. Real-time

### 5.1 WebSocket

- [ ] Conexão estabelecida ao abrir app
- [ ] Reconexão automática em caso de queda
- [ ] Indicador de conexão (se desconectado)

### 5.2 Mensagens

- [ ] Nova mensagem aparece em tempo real
- [ ] Não precisa pull-to-refresh
- [ ] Som/vibração ao receber (se habilitado)

### 5.3 Status

- [ ] "Digitando..." aparece em < 1 segundo
- [ ] "Digitando..." some após 5 segundos sem atividade
- [ ] Status online/offline atualiza em tempo real
- [ ] Status de leitura atualiza em tempo real

---

## 6. Notificações

### 6.1 Push

- [ ] Push recebido quando nova mensagem
- [ ] Push mostra nome do remetente
- [ ] Push mostra preview da mensagem
- [ ] Tap na notificação abre conversa
- [ ] Não recebe push se conversa aberta
- [ ] Não recebe push se conversa silenciada

### 6.2 Configurações

- [ ] Pode desabilitar notificações globais
- [ ] Pode silenciar conversa específica
- [ ] Opções de duração do silenciar
- [ ] Configuração de som on/off

---

## 7. Offline

### 7.1 Cache

- [ ] Lista de conversas disponível offline
- [ ] Últimas mensagens disponíveis offline
- [ ] Indicador visual "Sem conexão"

### 7.2 Limitações

- [ ] Não pode enviar mensagens offline
- [ ] Mensagem de erro ao tentar enviar offline
- [ ] Sync automático ao reconectar

---

## 8. Validação Final

### 8.1 Funcional (End-to-End)

- [ ] Criar conversa direta
- [ ] Enviar mensagem de texto
- [ ] Enviar imagem
- [ ] Gravar e enviar áudio
- [ ] Responder mensagem
- [ ] Reagir com emoji
- [ ] Criar grupo
- [ ] Enviar mensagem no grupo
- [ ] Sair do grupo

### 8.2 Performance

| Operação | Meta | Status |
|----------|------|--------|
| Carregar lista de conversas | < 2s | [ ] |
| Carregar mensagens | < 2s | [ ] |
| Enviar mensagem (texto) | < 1s | [ ] |
| Upload de imagem | < 5s | [ ] |
| Latência real-time | < 500ms | [ ] |

### 8.3 Segurança

- [ ] Só acessa conversas que participa
- [ ] Não pode editar mensagem de outro
- [ ] Não pode deletar mensagem de outro
- [ ] Não pode gerenciar grupo sem ser admin
- [ ] Token JWT validado em todas as requests

### 8.4 Acessibilidade

- [ ] Labels em elementos interativos
- [ ] Contraste adequado
- [ ] Touch targets >= 44x44px
- [ ] VoiceOver/TalkBack funcional

### 8.5 Edge Cases

- [ ] Conversa com usuário bloqueado
- [ ] Mensagem muito longa
- [ ] Arquivo muito grande (erro tratado)
- [ ] Muitas mensagens (scroll funciona)
- [ ] Muitos participantes no grupo

---

## Relacionados

- [Especificação](spec.md) - Funcionalidades e telas
- [API](api.md) - Endpoints
- [Notificações](../07-notificacoes/) - Sistema de push
