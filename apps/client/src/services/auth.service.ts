import { apiClient, adminApiClient } from '@/lib/api-client';
import type { ApiResponse, AuthResponse, AdminAuthResponse, Company, AdminUser } from '@/types/api';

export const authService = {
  async register(data: {
    name: string; email: string; password: string;
    size: string; monthlyRevenue: string;
  }): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data.data!;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    return res.data.data!;
  },

  async getMe(): Promise<Company> {
    const res = await apiClient.get<ApiResponse<Company>>('/auth/me');
    return res.data.data!;
  },
};

export const adminAuthService = {
  async login(email: string, password: string): Promise<AdminAuthResponse> {
    const res = await adminApiClient.post<ApiResponse<AdminAuthResponse>>('/admin/auth/login', { email, password });
    return res.data.data!;
  },

  async getMe(): Promise<AdminUser> {
    const res = await adminApiClient.get<ApiResponse<AdminUser>>('/admin/auth/me');
    return res.data.data!;
  },
};
