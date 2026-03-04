import { apiClient } from '@/lib/api-client';
import type { ApiResponse, Talent } from '@/types/api';

export interface TalentSearchParams {
  search?: string;
  roleCategories?: string;
  regions?: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  englishProficiency?: string;
  availability?: string;
  isImmediatelyAvailable?: boolean;
  yearsOfExperienceMin?: number;
  yearsOfExperienceMax?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export const talentService = {
  async search(params: TalentSearchParams): Promise<{ talents: Talent[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    // Remove undefined/empty params before sending
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== '' && v !== null)
    );
    const res = await apiClient.get<ApiResponse<Talent[]>>('/talent', { params: cleanParams });
    return {
      talents: res.data.data || [],
      meta: res.data.meta || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  async getById(id: string): Promise<Talent> {
    const res = await apiClient.get<ApiResponse<Talent>>(`/talent/${id}`);
    return res.data.data!;
  },
};
