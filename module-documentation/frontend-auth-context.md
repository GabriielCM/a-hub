# Modulo: Auth Context (Frontend)

**Localização:** `apps/frontend/lib/auth-context.tsx`

## Visão Geral

React Context para gerenciamento de estado de autenticação. Provê tokens, dados do usuário e funções de login/logout.

## Interface

```typescript
interface AuthContextType {
  user: User | null;
  accessToken: string | null;  // IMPORTANTE: use "accessToken", não "token"
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

## Storage

Tokens são armazenados em `localStorage`:

```typescript
const ACCESS_TOKEN_KEY = 'a-hub-access-token';
const REFRESH_TOKEN_KEY = 'a-hub-refresh-token';
```

## Uso

### Provider

Deve envolver a aplicação no root layout:

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Hook useAuth

```tsx
'use client';

import { useAuth } from '@/lib/auth-context';

export default function MyComponent() {
  const {
    user,
    accessToken,      // Use este para chamadas à API
    isLoading,
    isAuthenticated,
    login,
    logout
  } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  // Chamada à API com token
  const handleAction = async () => {
    await api.someEndpoint(accessToken);
  };
}
```

## Fluxo de Inicialização

1. **Componente monta** → `isLoading = true`
2. **Verifica localStorage** por tokens salvos
3. **Se tokens existem:**
   - Tenta buscar `/users/me` com access token
   - Se falhar (token expirado), tenta refresh
   - Se refresh falhar, limpa auth
4. **Define estado** → `isLoading = false`

## Funções

### login(email, password)
1. Chama `api.login()`
2. Salva tokens no localStorage
3. Define `user` e `accessToken` no state

### register(name, email, password)
1. Chama `api.register()`
2. Salva tokens no localStorage
3. Define `user` e `accessToken` no state

### logout()
1. Chama `api.logout()` (invalida refresh no backend)
2. Limpa localStorage
3. Limpa state

## Refresh Automático

O context tenta renovar tokens automaticamente na inicialização:

```typescript
try {
  const userData = await api.getMe(storedAccessToken);
  // Token válido
} catch {
  // Token expirado, tenta refresh
  const tokens = await api.refreshToken(storedRefreshToken);
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}
```

## Erro Comum

**Errado:**
```typescript
const { token } = useAuth();  // ERRO: 'token' não existe
```

**Correto:**
```typescript
const { accessToken } = useAuth();  // Correto
```

## Proteção de Rotas

O context não protege rotas automaticamente. Use condicionais nos componentes:

```tsx
const { isAuthenticated, isLoading, user } = useAuth();

if (isLoading) return <Loading />;
if (!isAuthenticated) {
  redirect('/login');
  return null;
}
if (user?.role !== 'ADMIN') {
  return <AccessDenied />;
}
```
