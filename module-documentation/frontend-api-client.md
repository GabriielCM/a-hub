# Modulo: API Client (Frontend)

**Localização:** `apps/frontend/lib/api.ts`

## Visão Geral

Cliente HTTP para comunicação com o backend. Singleton exportado como `api`.

## Configuração

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
```

**Variável de ambiente:**
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Para acesso mobile na rede local:
NEXT_PUBLIC_API_URL=http://192.168.1.7:3001/api
```

## Uso

```typescript
import { api } from '@/lib/api';

// Endpoints públicos
const spaces = await api.getSpaces();

// Endpoints autenticados
const { accessToken } = useAuth();
const bookings = await api.getMyBookings(accessToken);
```

## Métodos Disponíveis

### Auth

| Método | Parâmetros | Retorno |
|--------|------------|---------|
| `login(email, password)` | string, string | `{ accessToken, refreshToken, user }` |
| `register(name, email, password)` | string, string, string | `{ accessToken, refreshToken, user }` |
| `refreshToken(refreshToken)` | string | `{ accessToken, refreshToken }` |
| `logout(token)` | string | void |

### Users

| Método | Parâmetros | Acesso |
|--------|------------|--------|
| `getMe(token)` | string | Autenticado |
| `getUsers(token)` | string | Admin |
| `updateUser(id, data, token)` | string, Partial<User>, string | Admin |
| `deleteUser(id, token)` | string, string | Admin |

### Spaces

| Método | Parâmetros | Acesso |
|--------|------------|--------|
| `getSpaces()` | - | Público |
| `getSpace(id)` | string | Público |
| `getSpaceAvailability(id, month, year)` | string, number, number | Público |
| `createSpace(data, token)` | CreateSpaceData, string | Admin |
| `updateSpace(id, data, token)` | string, Partial<CreateSpaceData>, string | Admin |
| `deleteSpace(id, token)` | string, string | Admin |

### Bookings

| Método | Parâmetros | Acesso |
|--------|------------|--------|
| `getMyBookings(token)` | string | Autenticado |
| `getAllBookings(token)` | string | Admin |
| `createBooking(data, token)` | CreateBookingData, string | Autenticado |
| `updateBookingStatus(id, status, token)` | string, string, string | Admin/Owner |
| `cancelBooking(id, token)` | string, string | Admin/Owner |

### Upload

| Método | Parâmetros | Acesso |
|--------|------------|--------|
| `uploadImage(file, token)` | File, string | Admin |

## Types Exportados

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'COLLABORATOR' | 'ADMIN' | 'DISPLAY';
  createdAt: string;
  updatedAt: string;
}

export interface Space {
  id: string;
  name: string;
  value: number;
  photos: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  bookings?: { id: string; date: string; status: string }[];
}

export interface SpaceAvailability {
  spaceId: string;
  month: number;
  year: number;
  bookedDates: { date: string; status: string }[];
}

export interface Booking {
  id: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  userId: string;
  spaceId: string;
  space?: Space;
  user?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpaceData {
  name: string;
  value: number;
  photos?: string[];
  description?: string;
}

export interface CreateBookingData {
  date: string;  // Formato: 'YYYY-MM-DD'
  spaceId: string;
}
```

## Tratamento de Erros

O cliente lança `Error` com mensagem do backend:

```typescript
try {
  await api.createBooking(data, token);
} catch (error) {
  // error.message contém mensagem do backend
  alert(error.message);
}
```

## Upload de Imagens

O método `uploadImage` usa `FormData` (não JSON):

```typescript
async uploadImage(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${this.baseUrl}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,  // Não usa Content-Type: application/json
  });

  return response.json();
}
```

## Padrão de Uso em Componentes

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, Space } from '@/lib/api';

export default function SpacesList() {
  const { accessToken } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      const data = await api.getSpaces();
      setSpaces(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateSpaceData) => {
    if (!accessToken) return;
    await api.createSpace(data, accessToken);
    loadSpaces();  // Recarrega lista
  };

  // ...
}
```
