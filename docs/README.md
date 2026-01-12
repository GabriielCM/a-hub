---
project: a-hub
version: "1.1"
last_updated: 2026-01-11
---

# A-hub - Documentação Técnica

> **Versão:** 1.1
> **Última atualização:** 11/01/2026
> **Status:** Em Desenvolvimento

---

## Sobre o Projeto

O A-hub é um aplicativo mobile para associações que centraliza todas as funcionalidades necessárias para engajamento de membros, gestão de eventos, sistema de benefícios e interação social. O app oferece uma experiência completa com feed social, stories, sistema de pontos gamificado, carteirinha digital com QR Code, gestão de eventos com check-in, e muito mais.

---

## Estrutura da Documentação

| Seção | Descrição |
|-------|-----------|
| [Visão Geral](00-overview/) | Produto, tipos de usuários, roadmap, glossário |
| [Dashboard](01-dashboard/) | Tela principal, feed social, stories, acessos rápidos |
| [Perfil](02-perfil/) | Perfil do usuário, badges, posts |
| [Carteirinha](03-carteirinha/) | Carteirinha digital, QR Code, benefícios |
| [Eventos](04-eventos/) | Gestão de eventos, check-in, display, badges |
| [Minha Carteira](05-minha-carteira/) | Scanner QR Code, transferências |
| [Sistema de Pontos](06-sistema-pontos/) | Gamificação, formas de ganhar/gastar |
| [Notificações](07-notificacoes/) | Tipos e configurações de notificações |
| [Mensagens](08-mensagens/) | Chat entre usuários |
| [Espaços](09-espacos/) | Cadastro de espaços físicos |
| [Reservas](10-reservas/) | Sistema de reservas |
| [Pedidos](11-pedidos/) | Pedidos de bar/restaurante |
| [Loja](12-loja/) | Loja de produtos |
| [Rankings](13-rankings/) | Sistema de rankings |
| [Suporte](14-suporte/) | Central de suporte |
| [Jukebox](15-jukebox/) | Sistema de música |
| [PDV](16-pdv/) | Pontos de venda (kiosks) |
| [Compartilhados](shared/) | Design system, autenticação, acessibilidade |
| [API](api/) | Documentação de endpoints |

---

## Status dos Módulos

| Módulo | Status | Prioridade | Docs |
|--------|--------|------------|------|
| Dashboard | 🟢 Completo | 🔴 MVP | [Ver](01-dashboard/) |
| Perfil | 🟢 Completo | 🔴 MVP | [Ver](02-perfil/) |
| Carteirinha | 🟢 Completo | 🔴 MVP | [Ver](03-carteirinha/) |
| Eventos | 🟢 Completo | 🔴 MVP | [Ver](04-eventos/) |
| Minha Carteira | 🟡 Parcial | 🔴 MVP | [Ver](05-minha-carteira/) |
| Sistema de Pontos | 🟡 Parcial | 🔴 MVP | [Ver](06-sistema-pontos/) |
| Notificações | 🟡 Parcial | 🔴 MVP | [Ver](07-notificacoes/) |
| Mensagens | 🟢 Completo | 🔴 MVP | [Ver](08-mensagens/) |
| Espaços | ⚪ Não Iniciado | 🟡 Fase 2 | [Ver](09-espacos/) |
| Reservas | ⚪ Não Iniciado | 🟡 Fase 2 | [Ver](10-reservas/) |
| Pedidos | ⚪ Não Iniciado | 🟡 Fase 2 | [Ver](11-pedidos/) |
| Loja | ⚪ Não Iniciado | 🟡 Fase 2 | [Ver](12-loja/) |
| Rankings | ⚪ Não Iniciado | 🟡 Fase 2 | [Ver](13-rankings/) |
| Suporte | ⚪ Não Iniciado | 🟡 Fase 2 | [Ver](14-suporte/) |
| Jukebox | ⚪ Não Iniciado | 🟢 Nice to Have | [Ver](15-jukebox/) |
| PDV | 🟡 Parcial | 🔴 MVP | [Ver](16-pdv/) |

---

## Guias Rápidos

### Por Tipo de Usuário
- [Tipos de Usuários](00-overview/user-types.md) - Common User, ADM, Display

### Funcionalidades Core
- [Feed Social](01-dashboard/spec.md#feed-de-usuários) - Posts, enquetes, comentários
- [Stories](01-dashboard/spec.md#stories-de-usuários) - Conteúdo efêmero
- [Sistema de Check-in](04-eventos/checkin-system.md) - QR Code dinâmico
- [Carteirinha Digital](03-carteirinha/spec.md) - Identificação e benefícios

### Técnico
- [Design System](shared/design-system.md) - Cores, tipografia, componentes
- [API Reference](api/endpoints-reference.md) - Todos os endpoints
- [Autenticação](shared/authentication.md) - Login e permissões

---

## Convenções

### Símbolos de Prioridade
- 🔴 **MVP:** Essencial para lançamento
- 🟡 **Fase 2:** Importante mas não crítico
- 🟢 **Nice to Have:** Desejável no futuro

### Símbolos de Status
- ⚪ **Não Iniciado**
- 🟡 **Em Especificação**
- 🔵 **Em Desenvolvimento**
- 🟢 **Concluído**
- 🔴 **Bloqueado**

### Estrutura de Arquivos por Módulo
```
[módulo]/
├── README.md              # Índice e visão geral
├── spec.md                # Especificação técnica
├── components.md          # Componentes UI (se aplicável)
├── api.md                 # Endpoints da API
└── acceptance-criteria.md # Critérios de aceitação
```

---

## Como Contribuir

1. Leia as [Convenções](shared/conventions.md) antes de editar
2. Mantenha o padrão de metadados YAML no topo de cada arquivo
3. Atualize a data `last_updated` ao modificar um arquivo
4. Adicione links internos quando referenciar outros módulos
5. Documente alterações significativas no [CHANGELOG](CHANGELOG.md)

---

## Links Úteis

- [Roadmap](00-overview/roadmap.md) - Fases de implementação
- [Glossário](00-overview/glossary.md) - Termos e definições
- [CHANGELOG](CHANGELOG.md) - Histórico de mudanças
