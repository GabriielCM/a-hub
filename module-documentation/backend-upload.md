# Modulo: Upload (Backend)

**Localização:** `apps/backend/src/upload/`

## Visão Geral

Upload de imagens para o Cloudinary. Usado para fotos dos espaços.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `upload.module.ts` | Configuração do módulo NestJS |
| `upload.service.ts` | Integração com Cloudinary |
| `upload.controller.ts` | Endpoints REST |

## Configuração Cloudinary

Variável de ambiente:
```env
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

O service parseia a URL e configura o SDK:
```typescript
// Formato: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
const regex = /cloudinary:\/\/(\d+):([^@]+)@(.+)/;
```

## Endpoints

Ambos requerem `JwtAuthGuard` + `RolesGuard` + `@Roles(Role.ADMIN)`.

### POST `/upload`
Upload de uma imagem.

**Content-Type:** `multipart/form-data`

**Body:**
- `file`: Arquivo de imagem

**Response:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "a-hub/spaces/abc123"
}
```

### POST `/upload/multiple`
Upload de até 5 imagens.

**Body:**
- `files`: Array de arquivos

**Response:**
```json
[
  { "url": "...", "publicId": "..." },
  { "url": "...", "publicId": "..." }
]
```

## Validações

| Validação | Limite |
|-----------|--------|
| Tipos aceitos | JPEG, PNG, WebP |
| Tamanho máximo | 5MB |
| Upload múltiplo | Máximo 5 arquivos |

## Transformações Aplicadas

Todas as imagens passam por transformações automáticas:

```typescript
transformation: [
  { width: 1200, height: 800, crop: 'limit' },  // Redimensiona mantendo proporção
  { quality: 'auto' },                           // Qualidade automática
  { fetch_format: 'auto' },                      // Formato otimizado (WebP se suportado)
]
```

## Métodos do Service

### uploadImage(file)
Upload de arquivo para Cloudinary.

**Parâmetros:**
- `file`: `Express.Multer.File`

**Retorno:**
- `{ url: string, publicId: string }`

**Erros:**
- `400 BadRequest` - Arquivo não fornecido
- `400 BadRequest` - Tipo de arquivo inválido
- `400 BadRequest` - Arquivo muito grande
- `400 BadRequest` - Falha no upload

### deleteImage(publicId)
Remove imagem do Cloudinary.

**Nota:** Este método existe mas não está exposto via endpoint. Pode ser útil para limpeza futura.

## Uso no Frontend

```typescript
// lib/api.ts
async uploadImage(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  return response.json();
}
```

## Folder no Cloudinary

Todas as imagens são salvas em: `a-hub/spaces/`
