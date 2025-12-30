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

  async searchUsers(token: string) {
    return this.request<Pick<User, 'id' | 'name' | 'email'>[]>('/users/search', { token });
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

  // Admin Points Report endpoints
  async getAdminPointsTransactions(filters: PointsReportFilters, token: string) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.type) params.append('type', filters.type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<AdminPointsTransaction[]>(`/points/admin/transactions${query}`, { token });
  }

  async getAdminPointsBalances(token: string) {
    return this.request<AdminPointsBalance[]>('/points/admin/balances', { token });
  }

  async getPointsSystemSummary(token: string) {
    return this.request<PointsSystemSummary>('/points/admin/summary', { token });
  }

  async exportPointsReport(filters: PointsReportFilters, token: string) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.type) params.append('type', filters.type);
    const query = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${this.baseUrl}/points/admin/export${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export points report');
    }

    return response.text();
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

  // Posts endpoints
  async getPosts(token: string, cursor?: string, limit?: number) {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<PaginatedPostsResponse>(`/posts${query}`, { token });
  }

  async getPost(id: string, token: string) {
    return this.request<Post>(`/posts/${id}`, { token });
  }

  async createPost(data: CreatePostData, token: string) {
    return this.request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updatePost(id: string, data: Partial<CreatePostData>, token: string) {
    return this.request<Post>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async deletePost(id: string, token: string) {
    return this.request(`/posts/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async likePost(id: string, token: string) {
    return this.request<void>(`/posts/${id}/like`, {
      method: 'POST',
      token,
    });
  }

  async unlikePost(id: string, token: string) {
    return this.request<void>(`/posts/${id}/like`, {
      method: 'DELETE',
      token,
    });
  }

  async getPostComments(postId: string, token: string) {
    return this.request<PostComment[]>(`/posts/${postId}/comments`, { token });
  }

  async createComment(postId: string, data: CreateCommentData, token: string) {
    return this.request<PostComment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteComment(postId: string, commentId: string, token: string) {
    return this.request(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      token,
    });
  }

  async togglePinPost(id: string, token: string) {
    return this.request<Post>(`/posts/${id}/pin`, {
      method: 'PATCH',
      token,
    });
  }

  async uploadUserImages(files: File[], token: string) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(`${this.baseUrl}/upload/user`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload images');
    }

    return response.json() as Promise<{ url: string; publicId: string }[]>;
  }

  // Push Notifications endpoints
  async getVapidPublicKey() {
    return this.request<{ publicKey: string }>('/notifications/vapid-public-key');
  }

  async subscribePush(data: PushSubscriptionData, token: string) {
    return this.request<void>('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async unsubscribePush(endpoint: string, token: string) {
    return this.request<void>('/notifications/unsubscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
      token,
    });
  }

  async unsubscribePushAll(token: string) {
    return this.request<void>('/notifications/unsubscribe-all', {
      method: 'DELETE',
      token,
    });
  }

  // ==================== Events Endpoints ====================

  // Admin Events CRUD
  async getEvents(token: string, query?: EventQueryParams) {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<Event[]>(`/events${queryString}`, { token });
  }

  async getEvent(id: string, token: string) {
    return this.request<Event>(`/events/${id}`, { token });
  }

  async createEvent(data: CreateEventData, token: string) {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateEvent(id: string, data: Partial<CreateEventData>, token: string) {
    return this.request<Event>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteEvent(id: string, token: string) {
    return this.request<void>(`/events/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async updateEventStatus(id: string, status: EventStatus, token: string) {
    return this.request<Event>(`/events/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token,
    });
  }

  // User Events
  async getAvailableEvents(token: string) {
    return this.request<EventAvailable[]>('/events/user/available', { token });
  }

  async getUserEvents(token: string) {
    return this.request<UserEvent[]>('/events/user/events', { token });
  }

  async eventCheckin(qrPayload: string, token: string) {
    return this.request<CheckinResult>('/events/checkin', {
      method: 'POST',
      body: JSON.stringify({ qrPayload }),
      token,
    });
  }

  async getMyEventCheckins(eventId: string, token: string) {
    return this.request<EventCheckin[]>(`/events/${eventId}/my-checkins`, { token });
  }

  async getCheckinStatus(eventId: string, token: string) {
    return this.request<CheckinStatus>(`/events/${eventId}/checkin-status`, { token });
  }

  // Display
  async getEventDisplay(id: string, token: string) {
    return this.request<EventDisplayData>(`/events/${id}/display`, { token });
  }

  async getCurrentQR(id: string, token: string) {
    return this.request<EventQRToken>(`/events/${id}/qr/current`, { token });
  }

  // Reports
  async getEventsSummary(query: EventReportQueryParams, token: string) {
    const params = new URLSearchParams();
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<EventSummary[]>(`/events/admin/summary${queryString}`, { token });
  }

  async getEventReport(id: string, query: EventReportQueryParams, token: string) {
    const params = new URLSearchParams();
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<EventReport>(`/events/${id}/report${queryString}`, { token });
  }

  async exportEventReportCsv(id: string, query: EventReportQueryParams, token: string) {
    const params = new URLSearchParams();
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${this.baseUrl}/events/${id}/report/csv${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export event report');
    }

    return response.text();
  }

  // ==================== Kyosk Endpoints ====================

  // Admin Kyosk CRUD
  async getKyosks(token: string) {
    return this.request<Kyosk[]>('/kyosk', { token });
  }

  async getKyosk(id: string, token: string) {
    return this.request<Kyosk>(`/kyosk/${id}`, { token });
  }

  async createKyosk(data: CreateKyoskData, token: string) {
    return this.request<Kyosk>('/kyosk', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateKyosk(id: string, data: Partial<CreateKyoskData>, token: string) {
    return this.request<Kyosk>(`/kyosk/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteKyosk(id: string, token: string) {
    return this.request<void>(`/kyosk/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async toggleKyoskStatus(id: string, token: string) {
    return this.request<Kyosk>(`/kyosk/${id}/status`, {
      method: 'PATCH',
      token,
    });
  }

  async getLowStockAlerts(token: string) {
    return this.request<LowStockAlert[]>('/kyosk/alerts/low-stock', { token });
  }

  // Kyosk Products CRUD
  async getKyoskProducts(kyoskId: string, token: string) {
    return this.request<KyoskProduct[]>(`/kyosk/${kyoskId}/products`, { token });
  }

  async getKyoskProduct(kyoskId: string, productId: string, token: string) {
    return this.request<KyoskProduct>(`/kyosk/${kyoskId}/products/${productId}`, { token });
  }

  async createKyoskProduct(kyoskId: string, data: CreateKyoskProductData, token: string) {
    return this.request<KyoskProduct>(`/kyosk/${kyoskId}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateKyoskProduct(kyoskId: string, productId: string, data: Partial<CreateKyoskProductData>, token: string) {
    return this.request<KyoskProduct>(`/kyosk/${kyoskId}/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteKyoskProduct(kyoskId: string, productId: string, token: string) {
    return this.request<void>(`/kyosk/${kyoskId}/products/${productId}`, {
      method: 'DELETE',
      token,
    });
  }

  async adjustKyoskProductStock(kyoskId: string, productId: string, data: KyoskAdjustStockData, token: string) {
    return this.request<KyoskProduct>(`/kyosk/${kyoskId}/products/${productId}/stock`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async toggleKyoskProductStatus(kyoskId: string, productId: string, token: string) {
    return this.request<KyoskProduct>(`/kyosk/${kyoskId}/products/${productId}/status`, {
      method: 'PATCH',
      token,
    });
  }

  // Kyosk Display
  async getKyoskDisplay(kyoskId: string, token: string) {
    return this.request<KyoskDisplayData>(`/kyosk/${kyoskId}/display`, { token });
  }

  async createKyoskOrder(kyoskId: string, data: CreateKyoskOrderData, token: string) {
    return this.request<KyoskOrder>(`/kyosk/${kyoskId}/display/checkout`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async getKyoskOrderStatus(kyoskId: string, orderId: string, token: string) {
    return this.request<KyoskOrder>(`/kyosk/${kyoskId}/display/order/${orderId}`, { token });
  }

  async cancelKyoskOrder(kyoskId: string, orderId: string, token: string) {
    return this.request<void>(`/kyosk/${kyoskId}/display/order/${orderId}`, {
      method: 'DELETE',
      token,
    });
  }

  // Kyosk Payment
  async validateKyoskPayment(qrPayload: string, token: string) {
    return this.request<KyoskPaymentPreview>('/kyosk/pay/validate', {
      method: 'POST',
      body: JSON.stringify({ qrPayload }),
      token,
    });
  }

  async payKyoskOrder(qrPayload: string, token: string) {
    return this.request<KyoskPaymentResult>('/kyosk/pay', {
      method: 'POST',
      body: JSON.stringify({ qrPayload }),
      token,
    });
  }

  // Kyosk Sales Reports
  async getKyoskSales(kyoskId: string, query: KyoskSalesQuery, token: string) {
    const params = new URLSearchParams();
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<KyoskSalesData>(`/kyosk/${kyoskId}/sales${queryString}`, { token });
  }

  async exportKyoskSalesCsv(kyoskId: string, query: KyoskSalesQuery, token: string) {
    const params = new URLSearchParams();
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${this.baseUrl}/kyosk/${kyoskId}/sales/export${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export kyosk sales');
    }

    return response.text();
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
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'EVENT_CHECKIN' | 'KYOSK_PURCHASE';
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

// Admin Points Report
export interface AdminPointsTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'EVENT_CHECKIN' | 'KYOSK_PURCHASE';
  amount: number;
  description: string;
  relatedUserId?: string;
  orderId?: string;
  createdAt: string;
  pointsBalance: {
    id: string;
    userId: string;
    balance: number;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface AdminPointsBalance {
  id: string;
  userId: string;
  balance: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PointsSystemSummary {
  totalPoints: number;
  totalUsers: number;
}

export interface PointsReportFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  type?: string;
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

// Posts
export interface AuthorWithPhoto {
  id: string;
  name: string;
  email: string;
  memberCard?: {
    photo: string | null;
  } | null;
}

export interface Post {
  id: string;
  content: string;
  photos: string[];
  authorId: string;
  author: AuthorWithPhoto;
  isPinned: boolean;
  pinnedAt?: string;
  isLikedByMe: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  content: string;
  authorId: string;
  author: AuthorWithPhoto;
  postId: string;
  createdAt: string;
}

export interface PaginatedPostsResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreatePostData {
  content: string;
  photos?: string[];
}

export interface CreateCommentData {
  content: string;
}

// Push Notifications
export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Events
export type EventStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Event {
  id: string;
  name: string;
  description?: string;
  startAt: string;
  endAt: string;
  totalPoints: number;
  status: EventStatus;
  allowMultipleCheckins: boolean;
  maxCheckinsPerUser?: number;
  checkinIntervalSeconds?: number;
  displayBackgroundColor?: string;
  displayLogo?: string;
  displayLayout?: string;
  qrRotationSeconds: number;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    checkins: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  name: string;
  description?: string;
  startAt: string;
  endAt: string;
  totalPoints: number;
  allowMultipleCheckins: boolean;
  maxCheckinsPerUser?: number;
  checkinIntervalSeconds?: number;
  displayBackgroundColor?: string;
  displayLogo?: string;
  displayLayout?: string;
  qrRotationSeconds?: number;
}

export interface EventQueryParams {
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
}

export interface EventAvailable {
  id: string;
  name: string;
  description?: string;
  startAt: string;
  endAt: string;
  totalPoints: number;
  allowMultipleCheckins: boolean;
  maxCheckinsPerUser?: number;
  _count: {
    checkins: number;
  };
}

export interface UserEvent extends EventAvailable {
  checkins: {
    id: string;
    checkinNumber: number;
    pointsAwarded: number;
    createdAt: string;
  }[];
  userCheckinCount: number;
  canCheckin: boolean;
}

export interface EventCheckin {
  id: string;
  eventId: string;
  userId: string;
  checkinNumber: number;
  pointsAwarded: number;
  createdAt: string;
  event?: {
    id: string;
    name: string;
    totalPoints: number;
    allowMultipleCheckins: boolean;
    maxCheckinsPerUser?: number;
  };
}

export interface CheckinResult {
  success: boolean;
  checkinId: string;
  pointsAwarded: number;
  checkinNumber: number;
  checkinsRemaining: number;
  event: {
    id: string;
    name: string;
  };
}

export interface CheckinStatus {
  event: {
    id: string;
    name: string;
    totalPoints: number;
    allowMultipleCheckins: boolean;
    maxCheckinsPerUser?: number;
  };
  userCheckinCount: number;
  checkinsRemaining: number;
  totalPointsEarned: number;
  canCheckin: boolean;
  waitTimeSeconds: number;
  lastCheckinAt: string | null;
}

export interface EventQRToken {
  id: string;
  eventId: string;
  sequence: number;
  payload: string;
  expiresAt: string;
  createdAt: string;
}

export interface EventDisplayData {
  event: {
    id: string;
    name: string;
    description?: string;
    startAt: string;
    endAt: string;
    totalPoints: number;
    allowMultipleCheckins: boolean;
    maxCheckinsPerUser?: number;
    displayBackgroundColor?: string;
    displayLogo?: string;
    displayLayout?: string;
    qrRotationSeconds: number;
  };
  qrPayload: string;
  expiresAt: string;
  nextRotationIn: number;
  stats: {
    totalCheckins: number;
    uniqueUsers: number;
  };
}

export interface EventReportQueryParams {
  startDate?: string;
  endDate?: string;
}

export interface EventSummary {
  id: string;
  name: string;
  startAt: string;
  endAt: string;
  status: EventStatus;
  totalPoints: number;
  checkinCount: number;
  pointsDistributed: number;
}

export interface EventReport {
  event: {
    id: string;
    name: string;
    startAt: string;
    endAt: string;
    totalPoints: number;
    allowMultipleCheckins: boolean;
    maxCheckinsPerUser?: number;
    status: EventStatus;
  };
  totalCheckins: number;
  uniqueUsers: number;
  totalPointsDistributed: number;
  checkins: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    checkinNumber: number;
    pointsAwarded: number;
    createdAt: string;
  }[];
  userStats: {
    userId: string;
    userName: string;
    userEmail: string;
    checkinCount: number;
    totalPoints: number;
    firstCheckin: string;
    lastCheckin: string;
  }[];
}

// Kyosk Types
export type KyoskStatus = 'ACTIVE' | 'INACTIVE';
export type KyoskProductStatus = 'ACTIVE' | 'INACTIVE';
export type KyoskOrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export interface Kyosk {
  id: string;
  name: string;
  description?: string;
  status: KyoskStatus;
  lowStockThreshold: number;
  _count?: {
    products: number;
    orders: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateKyoskData {
  name: string;
  description?: string;
  lowStockThreshold?: number;
}

export interface KyoskProduct {
  id: string;
  kyoskId: string;
  name: string;
  description?: string;
  image?: string;
  pointsPrice: number;
  stock: number;
  status: KyoskProductStatus;
  stockHistory?: KyoskStockMovement[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateKyoskProductData {
  name: string;
  description?: string;
  image?: string;
  pointsPrice: number;
  stock: number;
}

export interface KyoskStockMovement {
  id: string;
  quantity: number;
  reason: string;
  createdAt: string;
}

export interface KyoskAdjustStockData {
  quantity: number;
  reason: string;
}

export interface KyoskDisplayData {
  kyosk: {
    id: string;
    name: string;
    description?: string;
  };
  products: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    pointsPrice: number;
    stock: number;
  }[];
}

export interface CreateKyoskOrderData {
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface KyoskOrderItem {
  id: string;
  productName: string;
  quantity: number;
  pointsPrice: number;
}

export interface KyoskOrder {
  id: string;
  kyoskId: string;
  totalPoints: number;
  status: KyoskOrderStatus;
  qrPayload: string;
  expiresAt: string;
  paidByUser?: {
    id: string;
    name: string;
  };
  paidAt?: string;
  items: KyoskOrderItem[];
  createdAt: string;
}

export interface KyoskPaymentPreview {
  kyoskName: string;
  totalPoints: number;
  expiresAt: string;
  items: {
    productName: string;
    quantity: number;
    pointsPrice: number;
  }[];
}

export interface KyoskPaymentResult {
  success: boolean;
  orderId: string;
  totalPoints: number;
  kyoskName: string;
}

export interface LowStockAlert {
  kyoskId: string;
  kyoskName: string;
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
}

export interface KyoskSalesQuery {
  startDate?: string;
  endDate?: string;
}

export interface KyoskSalesData {
  kyosk: {
    id: string;
    name: string;
  };
  summary: {
    totalSales: number;
    totalPoints: number;
    totalItems: number;
  };
  orders: {
    id: string;
    totalPoints: number;
    paidAt: string;
    paidByUser?: {
      id: string;
      name: string;
      email: string;
    };
    items: {
      productName: string;
      quantity: number;
      pointsPrice: number;
    }[];
  }[];
}

export const api = new ApiClient(API_URL);
