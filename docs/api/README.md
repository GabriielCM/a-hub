---
section: api
status: complete
last_updated: 2026-01-12
---

# API Reference

[← Voltar ao Índice](../README.md)

---

Documentação centralizada de todos os endpoints da API do A-hub.

---

## Documentos

| Documento | Descrição |
|-----------|-----------|
| [Referência de Endpoints](endpoints-reference.md) | Lista consolidada de todos os endpoints |

---

## Autenticação

Todos os endpoints (exceto login) requerem autenticação via JWT.

```
Authorization: Bearer <token>
```

---

## Base URL

```
Produção: https://api.ahub.com.br/v1
Staging:  https://api-staging.ahub.com.br/v1
```

---

## Formato de Resposta

Todas as respostas são em JSON.

**Sucesso:**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

**Erro:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro"
  }
}
```

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | OK - Sucesso |
| 201 | Created - Recurso criado |
| 400 | Bad Request - Parâmetros inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: duplicata) |
| 422 | Unprocessable - Dados inválidos |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |

---

## Rate Limiting

- 100 requests por minuto por usuário
- Headers de resposta indicam limite restante

---

## APIs por Módulo

- [Dashboard API](../01-dashboard/api.md)
- [Perfil API](../02-perfil/api.md)
- [Carteirinha API](../03-carteirinha/api.md)
- [Eventos API](../04-eventos/api.md)
- [Minha Carteira API](../05-minha-carteira/api.md)
- [Sistema de Pontos API](../06-sistema-pontos/api.md)
- [Mensagens API](../08-mensagens/api.md)
- [PDV API](../16-pdv/api.md)

---

## Relacionados

- [Autenticação](../shared/authentication.md)
