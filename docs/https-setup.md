# HTTPS Setup - Desenvolvimento Local

Este guia explica como configurar HTTPS para desenvolvimento local usando mkcert.

## Pré-requisitos

### Instalar mkcert

**Windows (Chocolatey):**
```powershell
choco install mkcert
```

**Windows (Scoop):**
```powershell
scoop install mkcert
```

**macOS (Homebrew):**
```bash
brew install mkcert
```

**Linux (apt):**
```bash
sudo apt install libnss3-tools
curl -JLO "https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-linux-amd64"
chmod +x mkcert-linux-amd64
sudo mv mkcert-linux-amd64 /usr/local/bin/mkcert
```

## Configuração Inicial

### 1. Instalar CA Local

Execute uma vez para instalar a autoridade certificadora local:

```bash
mkcert -install
```

### 2. Gerar Certificados

Na raiz do projeto:

```bash
pnpm certs:generate
```

Ou manualmente (incluindo IP local para acesso mobile):

```bash
cd certs
mkcert localhost 127.0.0.1 ::1 192.168.1.7
```

Isso gera dois arquivos:
- `localhost+3.pem` - Certificado
- `localhost+3-key.pem` - Chave privada

## Executando em HTTPS

### Desenvolvimento Completo (Frontend + Backend)

```bash
pnpm dev
```

- Frontend: https://localhost:3000 ou https://192.168.1.7:3000
- Backend: https://localhost:3001/api ou https://192.168.1.7:3001/api

### Apenas Backend

```bash
pnpm --filter @a-hub/backend run dev
```

### Apenas Frontend

```bash
pnpm --filter @a-hub/frontend run dev
```

### Fallback HTTP (se necessário)

```bash
pnpm --filter @a-hub/frontend run dev:http
```

## Variáveis de Ambiente

### Backend (`apps/backend/.env`)

```env
HTTPS_ENABLED=true
HTTPS_KEY_PATH=../../certs/localhost+3-key.pem
HTTPS_CERT_PATH=../../certs/localhost+3.pem
```

### Frontend (`apps/frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://192.168.1.7:3001/api
```

## Produção (Vercel + Railway)

Em produção, HTTPS é gerenciado automaticamente:

- **Vercel:** SSL automático para frontend
- **Railway:** SSL termination automático para backend

### Variáveis de Produção

**Backend (Railway):**
```env
HTTPS_ENABLED=false
FRONTEND_URL=https://your-app.vercel.app
```

**Frontend (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
```

## Troubleshooting

### Certificado não confiável

Execute novamente:
```bash
mkcert -install
```

### Erro "Cannot find certificate"

Verifique se os arquivos existem em `certs/`:
```bash
ls certs/
# Deve mostrar: localhost+2-key.pem  localhost+2.pem
```

### Acesso via IP local (mobile testing)

Os certificados já incluem o IP 192.168.1.7. Para usar outro IP:

```bash
cd certs
mkcert localhost 127.0.0.1 ::1 SEU_IP_LOCAL
```

Atualize os caminhos em `.env` se o nome do arquivo mudar.

### CORS errors

Verifique se `FRONTEND_URL` está configurado corretamente no backend para produção.

---

## Instalando Certificado no Celular

Para que o celular confie no certificado local, você precisa instalar o CA root do mkcert.

### Localizar o CA root

```bash
mkcert -CAROOT
# Retorna algo como: C:\Users\mdcar\AppData\Local\mkcert
```

O arquivo necessário é `rootCA.pem` nessa pasta.

### Android

1. Copiar `rootCA.pem` para o celular (via cabo USB, email, Google Drive, etc.)
2. Ir em **Configurações > Segurança > Criptografia e credenciais**
3. Tocar em **Instalar certificado > Certificado CA**
4. Selecionar o arquivo `rootCA.pem`
5. Confirmar a instalação (pode pedir PIN/senha)

### iOS

1. Copiar `rootCA.pem` para o celular (AirDrop, email, iCloud, etc.)
2. Abrir o arquivo - será redirecionado para Ajustes
3. Ir em **Ajustes > Geral > VPN e Gerenciamento de Dispositivo**
4. Tocar no perfil do certificado e instalar
5. Ir em **Ajustes > Geral > Sobre > Confiança de Certificado**
6. Ativar **Confiança Total** para o certificado mkcert

### Testar no Celular

Após instalar o certificado, acesse:
- https://192.168.1.7:3000 (Frontend)
- https://192.168.1.7:3001/api (Backend)
