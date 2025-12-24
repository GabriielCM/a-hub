# Modulo: Benefits (Backend)

**Localizacao:** `apps/backend/src/benefits/`

## Visao Geral

Gerenciamento de beneficios (descontos e parcerias) disponiveis para associados. Inclui estabelecimentos parceiros que oferecem descontos e parcerias exclusivas para membros da associacao.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `benefits.module.ts` | Configuracao do modulo NestJS |
| `benefits.service.ts` | Logica de negocio |
| `benefits.controller.ts` | Endpoints REST |
| `dto/create-benefit.dto.ts` | DTO para criacao |
| `dto/update-benefit.dto.ts` | DTO para atualizacao |

## Modelo de Dados

```prisma
enum BenefitType {
  DISCOUNT
  PARTNERSHIP
}

model Benefit {
  id           String      @id @default(uuid())
  type         BenefitType
  name         String
  description  String?
  photos       String[]
  address      String?
  city         String?
  state        String?
  neighborhood String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}
```

### Campos

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | UUID | Identificador unico do beneficio |
| `type` | BenefitType | Tipo: DISCOUNT ou PARTNERSHIP |
| `name` | String | Nome do beneficio/estabelecimento (max 100 chars) |
| `description` | String? | Descricao detalhada (max 500 chars) |
| `photos` | String[] | URLs das fotos (max 5 fotos) |
| `address` | String? | Endereco do estabelecimento |
| `city` | String? | Cidade |
| `state` | String? | Estado (UF) |
| `neighborhood` | String? | Bairro |
| `createdAt` | DateTime | Data de criacao |
| `updatedAt` | DateTime | Data da ultima atualizacao |

### BenefitType Enum

| Valor | Descricao |
|-------|-----------|
| `DISCOUNT` | Desconto oferecido por estabelecimento parceiro |
| `PARTNERSHIP` | Parceria institucional com beneficios exclusivos |

## Endpoints

### POST `/benefits` (Admin)
Cria um novo beneficio.

**Acesso:** Apenas ADMIN

**Body:**
```json
{
  "type": "DISCOUNT",
  "name": "Farmacia Sao Joao",
  "description": "10% de desconto em medicamentos",
  "photos": ["https://cloudinary.com/foto1.jpg"],
  "address": "Rua Principal, 123",
  "city": "Palotina",
  "state": "PR",
  "neighborhood": "Centro"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "type": "DISCOUNT",
  "name": "Farmacia Sao Joao",
  "description": "10% de desconto em medicamentos",
  "photos": ["https://cloudinary.com/foto1.jpg"],
  "address": "Rua Principal, 123",
  "city": "Palotina",
  "state": "PR",
  "neighborhood": "Centro",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

**Erros:**
- `400 Bad Request` - Validacao falhou (nome muito longo, muitas fotos, etc.)

### GET `/benefits` (Publico)
Lista todos os beneficios. Suporta filtragem por tipo.

**Acesso:** Publico (sem autenticacao)

**Query Params:**
| Param | Tipo | Descricao |
|-------|------|-----------|
| `type` | string | Filtra por tipo: `DISCOUNT` ou `PARTNERSHIP` (opcional) |

**Exemplos:**
- `GET /benefits` - Lista todos
- `GET /benefits?type=DISCOUNT` - Lista apenas descontos
- `GET /benefits?type=PARTNERSHIP` - Lista apenas parcerias

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "DISCOUNT",
    "name": "Farmacia Sao Joao",
    "description": "10% de desconto em medicamentos",
    "photos": ["https://..."],
    "address": "Rua Principal, 123",
    "city": "Palotina",
    "state": "PR",
    "neighborhood": "Centro",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
]
```

### GET `/benefits/:id` (Publico)
Retorna um beneficio especifico.

**Acesso:** Publico (sem autenticacao)

**Response:**
```json
{
  "id": "uuid",
  "type": "PARTNERSHIP",
  "name": "Academia Fit",
  "description": "Mensalidade com 20% de desconto",
  "photos": ["https://..."],
  "address": "Av. Brasil, 456",
  "city": "Palotina",
  "state": "PR",
  "neighborhood": "Jardim",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

**Erros:**
- `404 Not Found` - Beneficio nao encontrado

### PATCH `/benefits/:id` (Admin)
Atualiza um beneficio.

**Acesso:** Apenas ADMIN

**Body:**
```json
{
  "name": "Farmacia Sao Joao - Matriz",
  "description": "15% de desconto em medicamentos",
  "photos": ["https://cloudinary.com/nova-foto.jpg"]
}
```

**Erros:**
- `400 Bad Request` - Validacao falhou
- `404 Not Found` - Beneficio nao encontrado

### DELETE `/benefits/:id` (Admin)
Remove um beneficio.

**Acesso:** Apenas ADMIN

**Erros:**
- `404 Not Found` - Beneficio nao encontrado

## Regras de Negocio

1. **Tipos de Beneficio:** Todo beneficio deve ter um tipo (`DISCOUNT` ou `PARTNERSHIP`). O tipo define a categoria do beneficio no sistema.

2. **Limite de Fotos:** Maximo de 5 fotos por beneficio. Tentativa de adicionar mais retorna erro de validacao.

3. **Limite de Nome:** Nome deve ter no maximo 100 caracteres.

4. **Limite de Descricao:** Descricao deve ter no maximo 500 caracteres.

5. **Acesso Publico para Leitura:** Endpoints de listagem e visualizacao sao publicos para que associados possam consultar beneficios sem autenticacao.

## DTOs

### CreateBenefitDto

```typescript
class CreateBenefitDto {
  @IsEnum(BenefitType)
  @IsNotEmpty()
  type: BenefitType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  photos?: string[];

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;
}
```

### UpdateBenefitDto

```typescript
class UpdateBenefitDto {
  @IsOptional()
  @IsEnum(BenefitType)
  type?: BenefitType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  photos?: string[];

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;
}
```

## Metodos do Service

### create(createBenefitDto)
Cria um novo beneficio.

### findAll(type?: BenefitType)
Lista beneficios. Se `type` for informado, filtra pelo tipo.

### findById(id)
Busca por ID. Lanca `NotFoundException` se nao encontrar.

### update(id, updateBenefitDto)
Atualiza beneficio. Lanca `NotFoundException` se nao encontrar.

### remove(id)
Remove beneficio. Lanca `NotFoundException` se nao encontrar.

## Guards Aplicados

- Endpoints publicos: GET `/benefits`, GET `/benefits/:id`
- Endpoints admin: POST, PATCH, DELETE (requerem `JwtAuthGuard` + `RolesGuard` + `@Roles(Role.ADMIN)`)

## Respostas de Erro

| Codigo | Mensagem | Causa |
|--------|----------|-------|
| 400 | "name must be shorter than or equal to 100 characters" | Nome excede limite |
| 400 | "description must be shorter than or equal to 500 characters" | Descricao excede limite |
| 400 | "photos must contain no more than 5 elements" | Mais de 5 fotos |
| 400 | "type must be one of the following values: DISCOUNT, PARTNERSHIP" | Tipo invalido |
| 404 | "Benefit not found" | Beneficio nao encontrado |
