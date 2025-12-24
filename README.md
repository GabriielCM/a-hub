# A-hub - Associação Cristofoli

PWA para agendamento de espaços da associação Cristofoli.

## Stack Tecnológica

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Nest.js + REST API
- **Database:** PostgreSQL + Prisma ORM
- **Storage:** Cloudinary
- **Auth:** JWT

## Pré-requisitos

- Node.js 18+
- pnpm 9+
- PostgreSQL

## Setup Local

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar banco de dados

```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Iniciar os servidores

```bash
# Na raiz do projeto
pnpm dev
```

Isso iniciará:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api

## Desenvolvimento Mobile (Rede Local)

## Prisma Seed

Credenciais de Acesso

  | Tipo        | Email                     | Senha      |
  |-------------|---------------------------|------------|
  | Admin       | admin@cristofoli.com.br   | admin123   |
  | Colaborador | joao@cristofoli.com.br    | user123    |
  | Colaborador | maria@cristofoli.com.br   | user123    |
  | Display     | display@cristofoli.com.br | display123 |

  Espaços Criados

  | Nome                 | Valor     |
  |----------------------|-----------|
  | Salão de Festas      | R$ 500,00 |
  | Churrasqueira        | R$ 300,00 |
  | Quadra Poliesportiva | R$ 150,00 |
  | Piscina              | R$ 200,00 |
  | Sala de Reuniões     | R$ 100,00 |


### Obter IP Local

**Windows:**
```bash
ipconfig
```

**macOS/Linux:**
```bash
ifconfig
```

### Acessar no Mobile

1. Conecte o dispositivo à mesma rede Wi-Fi
2. Acesse: `http://SEU_IP_LOCAL:3000`

### HTTPS Local (para câmera)

Para usar a câmera em dispositivos móveis, é necessário HTTPS:

1. Instale mkcert:
```bash
# Windows (chocolatey)
choco install mkcert

# macOS
brew install mkcert

# Linux
sudo apt install mkcert
```

2. Crie certificados:
```bash
mkcert -install
mkcert localhost SEU_IP_LOCAL
```

3. Configure o Next.js para usar HTTPS (ver documentação do Next.js)

## Estrutura do Projeto

```
A-hub/
├── apps/
│   ├── frontend/          # Next.js PWA
│   └── backend/           # Nest.js API
├── packages/
│   └── shared/            # Types compartilhados
├── turbo.json
└── package.json
```

## Scripts Disponíveis

```bash
pnpm dev          # Inicia ambiente de desenvolvimento
pnpm build        # Build de produção
pnpm lint         # Lint do código
pnpm test         # Executa testes
```

## Endpoints da API

### Auth
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/me` - Usuário atual
- `PATCH /api/users/:id` - Atualizar usuário (admin)
- `DELETE /api/users/:id` - Remover usuário (admin)

### Spaces
- `GET /api/spaces` - Listar espaços
- `GET /api/spaces/:id` - Detalhe do espaço
- `GET /api/spaces/:id/availability` - Disponibilidade
- `POST /api/spaces` - Criar espaço (admin)
- `PATCH /api/spaces/:id` - Atualizar espaço (admin)
- `DELETE /api/spaces/:id` - Remover espaço (admin)

### Bookings
- `GET /api/bookings` - Minhas reservas
- `GET /api/bookings/all` - Todas reservas (admin)
- `POST /api/bookings` - Criar reserva
- `PATCH /api/bookings/:id` - Atualizar status
- `DELETE /api/bookings/:id` - Cancelar reserva

### Upload
- `POST /api/upload` - Upload de imagem (admin)

## Variáveis de Ambiente

### Backend (.env)
```
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
CLOUDINARY_URL="cloudinary://..."
PORT=3001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Tipos de Usuários

- **COLLABORATOR:** Visualizar e reservar espaços
- **ADMIN:** CRUD completo + aprovação de reservas
- **DISPLAY:** Modo kiosk (visualização apenas)

## Licença

Privado - Cristofoli
