export type UserRole = "ADMIN" | "FUNCIONARIO";

export interface AuthResponse {
  token: string;
  type: string;
  expiresIn: number;
  username: string;
  role: UserRole;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string>;
}
