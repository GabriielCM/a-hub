const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'An error occurred');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', {
      method: 'POST',
      token: refreshToken,
    });
  }

  async logout(token: string) {
    return this.request('/auth/logout', {
      method: 'POST',
      token,
    });
  }

  // User endpoints
  async getMe(token: string) {
    return this.request<User>('/users/me', { token });
  }

  async getUsers(token: string) {
    return this.request<User[]>('/users', { token });
  }

  async updateUser(id: string, data: Partial<User>, token: string) {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteUser(id: string, token: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Space endpoints
  async getSpaces() {
    return this.request<Space[]>('/spaces');
  }

  async getSpace(id: string) {
    return this.request<Space>(`/spaces/${id}`);
  }

  async getSpaceAvailability(id: string, month: number, year: number) {
    return this.request<SpaceAvailability>(
      `/spaces/${id}/availability?month=${month}&year=${year}`
    );
  }

  async createSpace(data: CreateSpaceData, token: string) {
    return this.request<Space>('/spaces', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateSpace(id: string, data: Partial<CreateSpaceData>, token: string) {
    return this.request<Space>(`/spaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteSpace(id: string, token: string) {
    return this.request(`/spaces/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Booking endpoints
  async getMyBookings(token: string) {
    return this.request<Booking[]>('/bookings', { token });
  }

  async getAllBookings(token: string) {
    return this.request<Booking[]>('/bookings/all', { token });
  }

  async createBooking(data: CreateBookingData, token: string) {
    return this.request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateBookingStatus(id: string, status: string, token: string) {
    return this.request<Booking>(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token,
    });
  }

  async cancelBooking(id: string, token: string) {
    return this.request(`/bookings/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Upload endpoint
  async uploadImage(file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    return response.json() as Promise<{ url: string; publicId: string }>;
  }
}

// Types
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
  bookings?: {
    id: string;
    date: string;
    status: string;
  }[];
}

export interface SpaceAvailability {
  spaceId: string;
  month: number;
  year: number;
  bookedDates: {
    date: string;
    status: string;
  }[];
}

export interface Booking {
  id: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  userId: string;
  spaceId: string;
  space?: Space;
  user?: {
    id: string;
    name: string;
    email: string;
  };
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
  date: string;
  spaceId: string;
}

export const api = new ApiClient(API_URL);
