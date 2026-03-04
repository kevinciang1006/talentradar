import { apiClient } from '@/lib/api-client';
import type { ApiResponse, Job } from '@/types/api';

export const jobService = {
  async list(): Promise<Job[]> {
    const res = await apiClient.get<ApiResponse<Job[]>>('/jobs');
    return res.data.data || [];
  },

  async create(data: {
    title: string; roleCategory: string; customRoleName?: string;
    description: string; requirements?: string;
    hourlyRateMin: number; hourlyRateMax: number; availability: string;
  }): Promise<Job> {
    const res = await apiClient.post<ApiResponse<Job>>('/jobs', data);
    return res.data.data!;
  },

  async getById(id: string): Promise<Job> {
    const res = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`);
    return res.data.data!;
  },

  async update(id: string, data: Partial<Job>): Promise<Job> {
    const res = await apiClient.patch<ApiResponse<Job>>(`/jobs/${id}`, data);
    return res.data.data!;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/jobs/${id}`);
  },
};
