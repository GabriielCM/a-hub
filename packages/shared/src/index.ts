// User types
export enum Role {
  COLLABORATOR = 'COLLABORATOR',
  ADMIN = 'ADMIN',
  DISPLAY = 'DISPLAY',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: Role;
}

// Space types
export interface Space {
  id: string;
  name: string;
  value: number;
  photos: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSpaceDto {
  name: string;
  value: number;
  photos?: string[];
  description?: string;
}

export interface UpdateSpaceDto {
  name?: string;
  value?: number;
  photos?: string[];
  description?: string;
}

// Booking types
export enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface Booking {
  id: string;
  date: Date;
  userId: string;
  spaceId: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  space?: Space;
}

export interface CreateBookingDto {
  date: string;
  spaceId: string;
}

export interface UpdateBookingDto {
  status?: BookingStatus;
}

// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
