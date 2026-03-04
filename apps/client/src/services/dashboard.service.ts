import { apiClient } from '@/lib/api-client';
import type { ApiResponse, DashboardStats, UpcomingInterview, ActivityItem, PipelineEntry } from '@/types/api';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return res.data.data!;
  },

  async getUpcomingInterviews(): Promise<UpcomingInterview[]> {
    const res = await apiClient.get<ApiResponse<UpcomingInterview[]>>('/dashboard/upcoming-interviews');
    return res.data.data || [];
  },

  async getActiveOffers(): Promise<PipelineEntry[]> {
    const res = await apiClient.get<ApiResponse<PipelineEntry[]>>('/dashboard/active-offers');
    return res.data.data || [];
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    const res = await apiClient.get<ApiResponse<ActivityItem[]>>('/dashboard/recent-activity');
    return res.data.data || [];
  },
};
