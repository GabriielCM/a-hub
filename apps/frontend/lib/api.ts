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

  // Member Card endpoints
  async getMemberCards(token: string) {
    return this.request<MemberCard[]>('/member-cards', { token });
  }

  async getMyMemberCard(token: string): Promise<MemberCard | null> {
    try {
      return await this.request<MemberCard>('/member-cards/my', { token });
    } catch (error) {
      // Return null if user has no member card (404)
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  async getMemberCard(id: string, token: string) {
    return this.request<MemberCard>(`/member-cards/${id}`, { token });
  }

  async createMemberCard(data: CreateMemberCardData, token: string) {
    return this.request<MemberCard>('/member-cards', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateMemberCard(id: string, data: UpdateMemberCardData, token: string) {
    return this.request<MemberCard>(`/member-cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteMemberCard(id: string, token: string) {
    return this.request<void>(`/member-cards/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Benefit endpoints
  async getBenefits(type?: 'DISCOUNT' | 'PARTNERSHIP') {
    const query = type ? `?type=${type}` : '';
    return this.request<Benefit[]>(`/benefits${query}`);
  }

  async getBenefit(id: string) {
    return this.request<Benefit>(`/benefits/${id}`);
  }

  async createBenefit(data: CreateBenefitData, token: string) {
    return this.request<Benefit>('/benefits', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateBenefit(id: string, data: UpdateBenefitData, token: string) {
    return this.request<Benefit>(`/benefits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteBenefit(id: string, token: string) {
    return this.request<void>(`/benefits/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Points endpoints
  async getMyPointsBalance(token: string) {
    return this.request<PointsBalance>('/points/balance', { token });
  }

  async getPointsHistory(token: string) {
    return this.request<PointsTransaction[]>('/points/history', { token });
  }

  async transferPoints(data: TransferPointsData, token: string) {
    return this.request<void>('/points/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async adjustPoints(userId: string, data: AdjustPointsData, token: string) {
    return this.request<PointsBalance>(`/points/adjust/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  // Store endpoints
  async getStoreItems() {
    return this.request<StoreItem[]>('/store/items');
  }

  async getStoreItem(id: string) {
    return this.request<StoreItem>(`/store/items/${id}`);
  }

  async createStoreItem(data: CreateStoreItemData, token: string) {
    return this.request<StoreItem>('/store/items', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateStoreItem(id: string, data: UpdateStoreItemData, token: string) {
    return this.request<StoreItem>(`/store/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteStoreItem(id: string, token: string) {
    return this.request<void>(`/store/items/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async adjustStock(id: string, data: AdjustStockData, token: string) {
    return this.request<StoreItem>(`/store/items/${id}/stock`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async getStockHistory(id: string, token: string) {
    return this.request<StockMovement[]>(`/store/items/${id}/stock-history`, { token });
  }

  // Cart endpoints
  async getCart(token: string) {
    return this.request<Cart>('/cart', { token });
  }

  async addToCart(data: AddToCartData, token: string) {
    return this.request<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateCartItem(itemId: string, data: UpdateCartItemData, token: string) {
    return this.request<Cart>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async removeFromCart(itemId: string, token: string) {
    return this.request<Cart>(`/cart/items/${itemId}`, {
      method: 'DELETE',
      token,
    });
  }

  async clearCart(token: string) {
    return this.request<void>('/cart', {
      method: 'DELETE',
      token,
    });
  }

  async checkout(token: string) {
    return this.request<Order>('/cart/checkout', {
      method: 'POST',
      token,
    });
  }

  // Orders endpoints
  async getMyOrders(token: string) {
    return this.request<Order[]>('/orders', { token });
  }

  async getAllOrders(token: string) {
    return this.request<Order[]>('/orders/all', { token });
  }

  async getOrder(id: string, token: string) {
    return this.request<Order>(`/orders/${id}`, { token });
  }

  async updateOrderStatus(id: string, data: UpdateOrderStatusData, token: string) {
    return this.request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
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

export interface MemberCard {
  id: string;
  userId: string;
  user: User;
  matricula: number;
  photo: string | null;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberCardData {
  userId: string;
  matricula: number;
  photo?: string;
}

export interface UpdateMemberCardData {
  matricula?: number;
  photo?: string;
}

export interface Benefit {
  id: string;
  type: 'DISCOUNT' | 'PARTNERSHIP';
  name: string;
  description: string | null;
  photos: string[];
  city: string;
  street: string;
  number: string;
  neighborhood: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBenefitData {
  type: 'DISCOUNT' | 'PARTNERSHIP';
  name: string;
  description?: string;
  photos?: string[];
  city: string;
  street: string;
  number: string;
  neighborhood: string;
}

export interface UpdateBenefitData {
  type?: 'DISCOUNT' | 'PARTNERSHIP';
  name?: string;
  description?: string;
  photos?: string[];
  city?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
}

// Points
export interface PointsBalance {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface PointsTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';
  amount: number;
  description: string;
  relatedUserId?: string;
  orderId?: string;
  createdAt: string;
}

export interface TransferPointsData {
  toUserId: string;
  amount: number;
  description?: string;
}

export interface AdjustPointsData {
  amount: number;
  reason: string;
}

// Store
export interface StoreItem {
  id: string;
  name: string;
  description?: string;
  pointsPrice: number;
  stock: number;
  photos: string[];
  offerEndsAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreItemData {
  name: string;
  description?: string;
  pointsPrice: number;
  stock: number;
  photos?: string[];
  offerEndsAt?: string;
}

export interface UpdateStoreItemData {
  name?: string;
  description?: string;
  pointsPrice?: number;
  photos?: string[];
  offerEndsAt?: string;
  isActive?: boolean;
}

export interface AdjustStockData {
  quantity: number;
  reason: string;
}

export interface StockMovement {
  id: string;
  quantity: number;
  reason: string;
  createdAt: string;
}

// Cart
export interface CartItem {
  id: string;
  storeItemId: string;
  storeItem: StoreItem;
  quantity: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalPoints: number;
  itemCount: number;
}

export interface AddToCartData {
  storeItemId: string;
  quantity?: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

// Orders
export interface OrderItem {
  id: string;
  storeItemId: string;
  storeItem: StoreItem;
  quantity: number;
  pointsPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  totalPoints: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderStatusData {
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

export const api = new ApiClient(API_URL);
