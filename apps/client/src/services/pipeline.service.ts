import { apiClient } from '@/lib/api-client';
import type { ApiResponse, PipelineEntry, NegotiationRound } from '@/types/api';

export const pipelineService = {
  async getByJob(jobId: string): Promise<PipelineEntry[]> {
    const res = await apiClient.get<ApiResponse<{ entries: PipelineEntry[] }>>('/pipeline', { params: { jobId } });
    return res.data.data?.entries || [];
  },

  async addToPipeline(jobId: string, talentId: string): Promise<PipelineEntry> {
    const res = await apiClient.post<ApiResponse<PipelineEntry>>('/pipeline', { jobId, talentId });
    return res.data.data!;
  },

  async updateStage(entryId: string, stage: string, note?: string): Promise<PipelineEntry> {
    const res = await apiClient.patch<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/stage`, { stage, note });
    return res.data.data!;
  },

  async addNote(entryId: string, content: string): Promise<PipelineEntry> {
    const res = await apiClient.post<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/notes`, { content });
    return res.data.data!;
  },

  async remove(entryId: string): Promise<void> {
    await apiClient.delete(`/pipeline/${entryId}`);
  },

  async assignScreeningTask(entryId: string, data: { title: string; description: string; dueDate: string; taskLink?: string; submissionLink?: string }): Promise<PipelineEntry> {
    const res = await apiClient.post<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/screening-task`, data);
    return res.data.data!;
  },

  async updateScreeningTaskStatus(entryId: string, status: string): Promise<PipelineEntry> {
    const res = await apiClient.patch<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/screening-task/status`, { status });
    return res.data.data!;
  },

  async scheduleInterview(entryId: string, data: {
    scheduledAt: string; candidateTimezone: string; meetingLink: string; notes?: string;
  }): Promise<PipelineEntry> {
    const res = await apiClient.post<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/interview`, data);
    return res.data.data!;
  },

  async updateInterviewStatus(entryId: string, status: string, notes?: string): Promise<PipelineEntry> {
    const res = await apiClient.patch<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/interview/status`, { status, notes });
    return res.data.data!;
  },

  async createOffer(entryId: string, data: {
    rate: number; hoursPerWeek: number; type: string; startDate: string; message?: string;
  }): Promise<PipelineEntry> {
    const res = await apiClient.post<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/offer`, data);
    return res.data.data!;
  },

  async completePayment(entryId: string, data: { method: string; transactionId: string }): Promise<PipelineEntry> {
    const res = await apiClient.post<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/payment`, data);
    return res.data.data!;
  },

  async signContract(entryId: string): Promise<PipelineEntry> {
    const res = await apiClient.post<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/contract/sign`, {});
    return res.data.data!;
  },

  async reject(entryId: string, reason: string, notes?: string): Promise<PipelineEntry> {
    const res = await apiClient.patch<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/reject`, { reason, notes });
    return res.data.data!;
  },

  async acceptCounterOffer(entryId: string): Promise<PipelineEntry> {
    const res = await apiClient.post<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/offer/accept-counter`, {});
    return res.data.data!;
  },

  async reviseOffer(entryId: string, data: {
    rate: number; hoursPerWeek?: number; message?: string;
  }): Promise<PipelineEntry> {
    const res = await apiClient.post<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/offer/revise`, data);
    return res.data.data!;
  },

  async declineCounterOffer(entryId: string, reason: string): Promise<PipelineEntry> {
    const res = await apiClient.post<ApiResponse<PipelineEntry>>(`/pipeline/${entryId}/offer/decline-counter`, { reason });
    return res.data.data!;
  },

  async getNegotiationHistory(entryId: string): Promise<NegotiationRound[]> {
    const res = await apiClient.get<ApiResponse<NegotiationRound[]>>(`/pipeline/${entryId}/offer/negotiation-history`);
    return res.data.data || [];
  },
};
