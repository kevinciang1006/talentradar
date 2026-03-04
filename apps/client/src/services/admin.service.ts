import { adminApiClient } from '@/lib/api-client';
import type { ApiResponse, AdminDashboardStats, PipelineEntry, AdminCompany, AdminCompanyDetail, Talent, Company, Job } from '@/types/api';
import { formatRelativeTime } from '@/utils/dateFormatters';

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
};

// Transform PipelineEntry (API format) to Deal (frontend format)
export const transformPipelineEntryToDeal = (entry: any): any => {
  // Backend now provides pre-populated flat structure - much simpler!
  // Convert file metadata if present
  const convertFileMetadata = (file: any) => {
    if (!file) return null;
    return {
      name: file.name,
      size: formatFileSize(file.size),
      date: formatRelativeTime(file.uploadedAt),
    };
  };

  // Build finalizing state with defaults if null
  const defaultFinalizing = {
    invoiceGenerated: false, invoiceAmount: "2500.00", invoiceDescription: "One-time placement fee", invoiceId: "", invoiceFile: null,
    paymentReceived: false, paymentMethod: "", paymentRef: "",
    contractGenerated: false, contractId: "", contractFile: null, sentToClient: false, sentToCandidate: false, clientSigned: false, candidateSigned: false, contractFullySigned: false,
    payrollPartner: "", payrollRef: "", payrollBankDetails: false, payrollSchedule: false, payrollFirstPay: "Feb 1, 2025", payrollNotes: "", payrollComplete: false,
    complianceTax: false, complianceLabor: false, compliancePrivacy: false, complianceNotes: "", complianceVerified: false, complianceFile: null,
    csmName: "", csmAssigned: false,
    startCandidateConfirmed: false, startClientConfirmed: false, startNotes: "", startDateConfirmed: false
  };

  // Merge API data with defaults to ensure all fields are defined
  const finalizingData = entry.finalizing || {};
  const finalizing = {
    ...defaultFinalizing,
    ...finalizingData,
    // Convert file metadata if present
    invoiceFile: convertFileMetadata(finalizingData.invoiceFile),
    contractFile: convertFileMetadata(finalizingData.contractFile),
    complianceFile: convertFileMetadata(finalizingData.complianceFile),
    // Ensure these always have values
    invoiceAmount: finalizingData.invoiceAmount || defaultFinalizing.invoiceAmount,
    invoiceDescription: finalizingData.invoiceDescription || defaultFinalizing.invoiceDescription,
    payrollFirstPay: finalizingData.payrollFirstPay || defaultFinalizing.payrollFirstPay,
  };

  return {
    id: entry.id || entry._id,
    // Backend provides these directly - no extraction needed!
    company: entry.company || 'Unknown Company',
    candidate: entry.candidate || 'Unknown Candidate',
    candidateEmail: entry.candidateEmail || '',
    candidateRegion: entry.candidateRegion || '',
    role: entry.role || 'Unknown Role',
    rate: entry.rate || 0,
    hours: entry.hours || 0,
    type: entry.type || 'full_time',
    startDate: entry.startDate || '',
    hmMessage: entry.hmMessage || '',
    stage: entry.stage as any, // Backend stage: 'offer', 'finalizing', 'hired'
    updated: entry.updated || formatRelativeTime(entry.updatedAt),
    // Offer object - map from backend offer if present
    offer: entry.offer ? {
      status: entry.offer.status as any,
      rate: entry.offer.rate || entry.rate || 0,
      hoursPerWeek: entry.offer.hoursPerWeek || entry.hours || 0,
      type: entry.offer.type || entry.type || 'full_time',
      startDate: entry.offer.startDate || entry.startDate || '',
      message: entry.offer.message || entry.hmMessage || '',
    } : undefined,
    // Offer flow - backend provides at root level (flat fields for backwards compatibility)
    offerApproved: entry.offerApproved || false,
    offerFlagged: entry.offerFlagged || false,
    flagIssueType: entry.flagIssueType || '',
    flagDetails: entry.flagDetails || '',
    presented: entry.presented || false,
    presentedDate: entry.presentedDate || '',
    candidateResponse: entry.candidateResponse || null,
    counterRate: entry.counterRate || null,
    counterMessage: entry.counterMessage || null,
    declineReason: entry.declineReason || '',
    declineNotes: entry.declineNotes || '',
    // Finalizing
    finalizing,
    timeline: entry.timeline?.map((t: any) => ({
      date: t.date,
      event: t.event
    })) || [],
  };
};

export const adminService = {
  // ============================================
  // Dashboard
  // ============================================
  async getStats(): Promise<AdminDashboardStats> {
    const res = await adminApiClient.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard/stats');
    return res.data.data!;
  },

  async getActionRequired(): Promise<PipelineEntry[]> {
    const res = await adminApiClient.get<ApiResponse<PipelineEntry[]>>('/admin/dashboard/action-required');
    return res.data.data || [];
  },

  // ============================================
  // Deal Management
  // ============================================
  async getDeals(params?: { stage?: string; search?: string; page?: number; limit?: number }): Promise<any[]> {
    const res = await adminApiClient.get<ApiResponse<PipelineEntry[]>>('/admin/deals', { params });
    const entries = res.data.data || [];
    return entries.map(transformPipelineEntryToDeal);
  },

  async getDealStats(): Promise<Record<string, number>> {
    const res = await adminApiClient.get<ApiResponse<Record<string, number>>>('/admin/deals/stats');
    return res.data.data!;
  },

  async getDealById(id: string): Promise<PipelineEntry> {
    const res = await adminApiClient.get<ApiResponse<PipelineEntry>>(`/admin/deals/${id}`);
    return res.data.data!;
  },

  async getDealTimeline(id: string): Promise<Array<{ date: string; event: string }>> {
    const res = await adminApiClient.get<ApiResponse<Array<{ date: string; event: string }>>>(`/admin/deals/${id}/timeline`);
    return res.data.data || [];
  },

  // ============================================
  // Offer Management
  // ============================================
  async approveDeal(dealId: string): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/offer/approve`, {});
    return res.data.data!;
  },

  async presentDeal(dealId: string): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/offer/present`, {});
    return res.data.data!;
  },

  async flagDeal(dealId: string, data: { issueType: string; details: string }): Promise<PipelineEntry> {
    const res = await adminApiClient.post<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/offer/flag`, data);
    return res.data.data!;
  },

  async unflagDeal(dealId: string): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/offer/unflag`);
    return res.data.data!;
  },

  async recordCandidateResponse(dealId: string, data: {
    response: 'accepted' | 'negotiating' | 'declined';
    counterRate?: number;
    counterMessage?: string;
    declineReason?: string;
    declineNotes?: string;
  }): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/offer/candidate-response`, data);
    return res.data.data!;
  },

  // ============================================
  // Finalization: Invoice & Payment
  // ============================================
  async generateInvoice(dealId: string, data: { amount: number; invoiceNumber: string; description?: string }): Promise<PipelineEntry> {
    const res = await adminApiClient.post<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/invoice/generate`, data);
    return res.data.data!;
  },

  async uploadInvoiceFile(dealId: string, file: File): Promise<{ file: { name: string; size: number; uploadedAt: string; url: string; mimeType: string } }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await adminApiClient.post<ApiResponse<{ file: { name: string; size: number; uploadedAt: string; url: string; mimeType: string } }>>(
      `/admin/deals/${dealId}/finalization/invoice/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data!;
  },

  async markPaymentReceived(dealId: string, data: {
    transactionId: string;
    amount: number;
    method: 'bank_transfer' | 'credit_card' | 'stripe' | 'other';
    paidAt?: string;
  }): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/payment/received`, data);
    return res.data.data!;
  },

  // ============================================
  // Finalization: Contract
  // ============================================
  async generateContract(dealId: string): Promise<PipelineEntry> {
    const res = await adminApiClient.post<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/contract/generate`, {});
    return res.data.data!;
  },

  async uploadContractFile(dealId: string, file: File): Promise<{ file: { name: string; size: number; uploadedAt: string; url: string; mimeType: string } }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await adminApiClient.post<ApiResponse<{ file: { name: string; size: number; uploadedAt: string; url: string; mimeType: string } }>>(
      `/admin/deals/${dealId}/finalization/contract/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data!;
  },

  async sendContractToClient(dealId: string): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/contract/send-client`);
    return res.data.data!;
  },

  async sendContractToCandidate(dealId: string): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/contract/send-candidate`);
    return res.data.data!;
  },

  async markClientSigned(dealId: string): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/contract/client-signed`, {
      signer: 'client'
    });
    return res.data.data!;
  },

  async markCandidateSigned(dealId: string): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/contract/candidate-signed`, {
      signer: 'candidate'
    });
    return res.data.data!;
  },

  // ============================================
  // Finalization: Payroll, Compliance, CSM, Start Date
  // ============================================
  async setupPayroll(dealId: string, data: {
    partner: string;
    reference: string;
    bankDetails: boolean;
    scheduleConfigured: boolean;
    firstPayDate: string;
    notes: string;
  }): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/payroll/setup`, data);
    return res.data.data!;
  },

  async uploadComplianceDoc(dealId: string, file: File): Promise<{ file: { name: string; size: number; uploadedAt: string; url: string; mimeType: string } }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await adminApiClient.post<ApiResponse<{ file: { name: string; size: number; uploadedAt: string; url: string; mimeType: string } }>>(
      `/admin/deals/${dealId}/finalization/compliance/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data!;
  },

  async verifyCompliance(dealId: string, data: {
    taxClassificationConfirmed: boolean;
    laborRequirementsMet: boolean;
    privacyRequirementsMet: boolean;
    notes: string;
  }): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/compliance/verify`, data);
    return res.data.data!;
  },

  async assignCSM(dealId: string, data: { csmName: string }): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/csm/assign`, data);
    return res.data.data!;
  },

  async confirmStartDate(dealId: string, data: {
    candidateConfirmed: boolean;
    clientConfirmed: boolean;
    notes: string;
  }): Promise<PipelineEntry> {
    const res = await adminApiClient.patch<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/finalization/start-date/confirm`, data);
    return res.data.data!;
  },

  // ============================================
  // Deal Completion
  // ============================================
  async completeDeal(dealId: string): Promise<PipelineEntry> {
    const res = await adminApiClient.post<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/complete`);
    return res.data.data!;
  },

  async addNote(dealId: string, content: string): Promise<PipelineEntry> {
    const res = await adminApiClient.post<ApiResponse<PipelineEntry>>(`/admin/deals/${dealId}/notes`, { content });
    return res.data.data!;
  },

  async getNotes(dealId: string): Promise<Array<{ content: string; createdAt: string; stage: string; authorType: string }>> {
    const res = await adminApiClient.get<ApiResponse<Array<{ content: string; createdAt: string; stage: string; authorType: string }>>>(`/admin/deals/${dealId}/notes`);
    return res.data.data || [];
  },

  // ============================================
  // Talent (admin view)
  // ============================================
  async getTalent(params?: Record<string, unknown>): Promise<{ talents: Talent[]; meta: Record<string, number> }> {
    const res = await adminApiClient.get<ApiResponse<Talent[]>>('/admin/talent', { params });
    return { talents: res.data.data || [], meta: res.data.meta || {} as Record<string, number> };
  },

  // ============================================
  // Companies
  // ============================================
  async getCompanies(): Promise<AdminCompany[]> {
    const res = await adminApiClient.get<ApiResponse<AdminCompany[]>>('/admin/companies');
    return res.data.data || [];
  },

  async getCompanyById(id: string): Promise<AdminCompanyDetail> {
    const res = await adminApiClient.get<ApiResponse<AdminCompanyDetail>>(`/admin/companies/${id}`);
    return res.data.data!;
  },
};
