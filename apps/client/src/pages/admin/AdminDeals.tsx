import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "@posthog/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { X, CheckCircle2, Shield, Upload, Link2, FileText, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import { getAvailabilityLabel, REGION_FLAGS } from "@/utils/constants";
import { formatDateTime } from "@/utils/dateFormatters";

// Backend stages
type BackendStage = "offer" | "finalizing" | "hired";
type OfferStatus = "sent" | "under_review" | "presented" | "accepted" | "negotiating" | "declined";

// Frontend column keys (for UI)
type DealStage = "new_offers" | "presented" | "accepted" | "in_progress" | "completed";

interface UploadedFile {
  name: string;
  size: string;
  date: string;
}

interface FinalizingState {
  // Invoice
  invoiceGenerated: boolean;
  invoiceAmount: string;
  invoiceDescription: string;
  invoiceId: string;
  invoiceFile: UploadedFile | null;
  paymentReceived: boolean;
  paymentMethod: string;
  paymentRef: string;
  // Contract
  contractGenerated: boolean;
  contractId: string;
  contractFile: UploadedFile | null;
  sentToClient: boolean;
  sentToCandidate: boolean;
  clientSigned: boolean;
  candidateSigned: boolean;
  contractFullySigned: boolean;
  // Payroll
  payrollPartner: string;
  payrollRef: string;
  payrollBankDetails: boolean;
  payrollSchedule: boolean;
  payrollFirstPay: string;
  payrollNotes: string;
  payrollComplete: boolean;
  // Compliance
  complianceTax: boolean;
  complianceLabor: boolean;
  compliancePrivacy: boolean;
  complianceNotes: string;
  complianceVerified: boolean;
  complianceFile: UploadedFile | null;
  // CSM
  csmName: string;
  csmAssigned: boolean;
  // Start Date
  startCandidateConfirmed: boolean;
  startClientConfirmed: boolean;
  startNotes: string;
  startDateConfirmed: boolean;
}

interface Deal {
  id: string;
  company: string;
  candidate: string;
  candidateEmail: string;
  candidateRegion: string;
  role: string;
  rate: number;
  hours: number;
  type: string;
  startDate: string;
  hmMessage: string;
  stage: BackendStage; // Backend stage: 'offer', 'finalizing', 'hired'
  updated: string;
  // Offer object with status
  offer?: {
    status: OfferStatus;
    rate: number;
    hoursPerWeek: number;
    type: string;
    startDate: string;
    message: string;
    negotiationHistory?: Array<{
      round: number;
      actor: 'company' | 'candidate';
      action: 'initial_offer' | 'counter_offer' | 'revised_offer' | 'accepted_counter' | 'declined_counter';
      rate: number;
      hoursPerWeek?: number;
      message?: string;
      createdAt: string;
      approvedByAdmin?: boolean;
      presentedAt?: string;
    }>;
  };
  // Offer flow (flat fields for backwards compatibility)
  offerApproved: boolean;
  offerFlagged: boolean;
  flagIssueType: string;
  flagDetails: string;
  presented: boolean;
  presentedDate: string;
  candidateResponse: string | null;
  counterRate: number | null;
  counterMessage: string | null;
  declineReason: string;
  declineNotes: string;
  // Finalizing
  finalizing: FinalizingState;
  timeline: { date: string; event: string }[];
}

const defaultFinalizing: FinalizingState = {
  invoiceGenerated: false, invoiceAmount: "2500.00", invoiceDescription: "One-time placement fee", invoiceId: "", invoiceFile: null,
  paymentReceived: false, paymentMethod: "stripe", paymentRef: "stripe_ch_demo_2025",
  contractGenerated: false, contractId: "", contractFile: null, sentToClient: false, sentToCandidate: false, clientSigned: false, candidateSigned: false, contractFullySigned: false,
  payrollPartner: "rl_partner", payrollRef: "PAY-2025-001", payrollBankDetails: true, payrollSchedule: true, payrollFirstPay: "2025-02-01", payrollNotes: "Profile created in payroll system. Contractor classification confirmed. Bi-weekly schedule configured.", payrollComplete: false,
  complianceTax: true, complianceLabor: true, compliancePrivacy: true, complianceNotes: "Independent contractor classification verified for country of residence.", complianceVerified: false, complianceFile: null,
  csmName: "Paula Martinez", csmAssigned: false,
  startCandidateConfirmed: false, startClientConfirmed: false, startNotes: "All onboarding materials sent. Candidate confirmed availability.", startDateConfirmed: false,
};

const initialDeals: Deal[] = [
  {
    id: "d1", company: "Acme Corp", candidate: "Maria Rodriguez", candidateEmail: "maria.rodriguez@example.com", candidateRegion: "Colombia (UTC-5)",
    role: "Admin Assistant", rate: 9, hours: 40, type: "full_time", startDate: "Jan 22, 2025",
    hmMessage: "Hi Maria, we loved your interview and would love to have you join our team.",
    stage: "offer", updated: "2h ago",
    offer: { status: "sent", rate: 9, hoursPerWeek: 40, type: "full_time", startDate: "Jan 22, 2025", message: "Hi Maria, we loved your interview and would love to have you join our team." },
    offerApproved: false, offerFlagged: false, flagIssueType: "", flagDetails: "", presented: false, presentedDate: "",
    candidateResponse: null, counterRate: null, counterMessage: null, declineReason: "", declineNotes: "",
    finalizing: { ...defaultFinalizing },
    timeline: [{ date: "Jan 18", event: "Offer sent by Acme Corp" }],
  },
  {
    id: "d2", company: "StartupCo", candidate: "Carlos Mendez", candidateEmail: "carlos.m@example.com", candidateRegion: "Mexico (UTC-6)",
    role: "Sales Dev Rep", rate: 11, hours: 40, type: "full_time", startDate: "Jan 25, 2025",
    hmMessage: "Welcome aboard Carlos!",
    stage: "finalizing", updated: "1d ago",
    offer: { status: "accepted", rate: 11, hoursPerWeek: 40, type: "full_time", startDate: "Jan 25, 2025", message: "Welcome aboard Carlos!" },
    offerApproved: true, offerFlagged: false, flagIssueType: "", flagDetails: "", presented: true, presentedDate: "Jan 16",
    candidateResponse: "accepted", counterRate: null, counterMessage: null, declineReason: "", declineNotes: "",
    finalizing: {
      ...defaultFinalizing,
      invoiceGenerated: true, invoiceId: "#RL-2025-0140", invoiceFile: { name: "invoice_RL-2025-0140.pdf", size: "198 KB", date: "Jan 18" },
      paymentReceived: true, paymentMethod: "bank_transfer", paymentRef: "TXN-88776655",
      contractGenerated: true, contractId: "#CTR-2025-0087", contractFile: { name: "contract_CTR-2025-0087.pdf", size: "312 KB", date: "Jan 19" },
      sentToClient: true, sentToCandidate: true, clientSigned: true, candidateSigned: true, contractFullySigned: true,
    },
    timeline: [
      { date: "Jan 15", event: "Offer sent" }, { date: "Jan 16", event: "Approved & presented" },
      { date: "Jan 17", event: "Accepted by Carlos" }, { date: "Jan 18", event: "Invoice sent & paid" },
      { date: "Jan 19", event: "Contract signed" },
    ],
  },
  {
    id: "d3", company: "TechFlow", candidate: "Thabo Molefe", candidateEmail: "thabo.m@example.com", candidateRegion: "South Africa (UTC+2)",
    role: "Executive Assistant", rate: 10, hours: 40, type: "full_time", startDate: "Jan 20, 2025",
    hmMessage: "Looking forward to working with you.",
    stage: "finalizing", updated: "3d ago",
    offer: { status: "accepted", rate: 10, hoursPerWeek: 40, type: "full_time", startDate: "Jan 20, 2025", message: "Looking forward to working with you." },
    offerApproved: true, offerFlagged: false, flagIssueType: "", flagDetails: "", presented: true, presentedDate: "Jan 12",
    candidateResponse: "accepted", counterRate: null, counterMessage: null, declineReason: "", declineNotes: "",
    finalizing: {
      ...defaultFinalizing,
      invoiceGenerated: true, invoiceId: "#RL-2025-0138", invoiceFile: { name: "invoice_RL-2025-0138.pdf", size: "201 KB", date: "Jan 15" },
      paymentReceived: true, paymentMethod: "stripe", paymentRef: "TXN-55443322",
      contractGenerated: true, contractId: "#CTR-2025-0085", contractFile: { name: "contract_CTR-2025-0085.pdf", size: "290 KB", date: "Jan 16" },
      sentToClient: true, sentToCandidate: true, clientSigned: true, candidateSigned: true, contractFullySigned: true,
      payrollPartner: "rl_partner", payrollRef: "PAY-2025-TM-001", payrollBankDetails: true, payrollSchedule: true, payrollComplete: true,
      complianceTax: true, complianceLabor: true, compliancePrivacy: true, complianceVerified: true,
    },
    timeline: [
      { date: "Jan 10", event: "Offer sent" }, { date: "Jan 12", event: "Accepted" },
      { date: "Jan 15", event: "Payment received" }, { date: "Jan 16", event: "Contract signed" },
      { date: "Jan 18", event: "Payroll & compliance complete" },
    ],
  },
  {
    id: "d4", company: "Acme Corp", candidate: "Sarah van der Berg", candidateEmail: "sarah.vdb@example.com", candidateRegion: "South Africa (UTC+2)",
    role: "Graphic Designer", rate: 9, hours: 30, type: "part_time", startDate: "Jan 28, 2025",
    hmMessage: "Excited to have you on the team.",
    stage: "hired", updated: "2d ago",
    offer: { status: "accepted", rate: 9, hoursPerWeek: 30, type: "part_time", startDate: "Jan 28, 2025", message: "Excited to have you on the team." },
    offerApproved: true, offerFlagged: false, flagIssueType: "", flagDetails: "", presented: true, presentedDate: "Jan 20",
    candidateResponse: "accepted", counterRate: null, counterMessage: null, declineReason: "", declineNotes: "",
    finalizing: {
      ...defaultFinalizing,
      invoiceGenerated: true, invoiceId: "#RL-2025-0135", invoiceFile: { name: "invoice_RL-2025-0135.pdf", size: "210 KB", date: "Jan 21" },
      paymentReceived: true, paymentMethod: "credit_card", paymentRef: "TXN-11223344",
      contractGenerated: true, contractId: "#CTR-2025-0082", contractFile: { name: "contract_CTR-2025-0082.pdf", size: "305 KB", date: "Jan 22" },
      sentToClient: true, sentToCandidate: true, clientSigned: true, candidateSigned: true, contractFullySigned: true,
      payrollPartner: "rl_partner", payrollRef: "PAY-2025-SV-001", payrollBankDetails: true, payrollSchedule: true, payrollFirstPay: "Feb 1, 2025", payrollComplete: true,
      complianceTax: true, complianceLabor: true, compliancePrivacy: true, complianceVerified: true,
      csmName: "Paula Martinez", csmAssigned: true,
      startCandidateConfirmed: true, startClientConfirmed: true, startDateConfirmed: true,
    },
    timeline: [
      { date: "Jan 18", event: "Offer sent" }, { date: "Jan 20", event: "Approved & presented" },
      { date: "Jan 21", event: "Accepted" }, { date: "Jan 21", event: "Invoice sent & paid ($2,500)" },
      { date: "Jan 22", event: "Contract signed by both parties" }, { date: "Jan 22", event: "Payroll setup complete" },
      { date: "Jan 23", event: "Compliance verified" }, { date: "Jan 23", event: "CSM assigned (Paula Martinez)" },
      { date: "Jan 23", event: "Start date confirmed (Jan 28)" }, { date: "Jan 25", event: "Deal closed — Hired ✅" },
    ],
  },
  {
    id: "d5", company: "GrowthCo", candidate: "Valentina Herrera", candidateEmail: "valentina.h@example.com", candidateRegion: "Colombia (UTC-5)",
    role: "Marketing Assistant", rate: 8, hours: 40, type: "full_time", startDate: "TBD",
    hmMessage: "", stage: "offer", updated: "5d ago",
    offer: { status: "presented", rate: 8, hoursPerWeek: 40, type: "full_time", startDate: "TBD", message: "" },
    offerApproved: true, offerFlagged: false, flagIssueType: "", flagDetails: "", presented: true, presentedDate: "Jan 13",
    candidateResponse: null, counterRate: null, counterMessage: null, declineReason: "", declineNotes: "",
    finalizing: { ...defaultFinalizing },
    timeline: [{ date: "Jan 12", event: "Offer sent" }, { date: "Jan 13", event: "Approved & presented" }],
  },
];

const stageColumns: { key: DealStage; label: string; color: string }[] = [
  { key: "new_offers", label: "New Offers", color: "bg-primary" },
  { key: "presented", label: "Presented", color: "bg-[hsl(270,60%,50%)]" },
  { key: "accepted", label: "Accepted", color: "bg-warning" },
  { key: "in_progress", label: "In Progress", color: "bg-[hsl(172,66%,50%)]" },
  { key: "completed", label: "Completed", color: "bg-emerald-500" },
];

const csmOptions = ["Paula Martinez", "David Chen", "Sofia Ruiz"];

// Format helper functions
const formatPaymentMethod = (method: string): string => {
  const map: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    credit_card: "Credit Card",
    stripe: "Stripe",
    other: "Other",
  };
  return map[method] || method;
};

const formatPayrollPartner = (partner: string): string => {
  const map: Record<string, string> = {
    rl_partner: "RL Partner",
    deel: "Deel",
    remote_com: "Remote.com",
    other: "Other",
  };
  return map[partner] || partner;
};

// Reusable file upload component
const FileUploadArea = ({ file, onUpload, onRemove, label }: {
  file: UploadedFile | null;
  onUpload: () => void;
  onRemove: () => void;
  label: string;
}) => {
  if (file) {
    return (
      <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
        <FileText className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
          <p className="text-[10px] text-muted-foreground">Uploaded {file.date} • {file.size}</p>
        </div>
        <button onClick={() => toast.info("File preview — available in production")} className="text-xs text-primary hover:underline shrink-0">View ↗</button>
        <button onClick={onRemove} className="text-xs text-destructive hover:text-destructive/80 shrink-0">✕</button>
      </div>
    );
  }
  return (
    <div className="border border-dashed border-border rounded-lg p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">📎 {label}</p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="text-xs h-7" onClick={onUpload}>
          <Upload className="h-3 w-3 mr-1" /> Upload File
        </Button>
        <span className="text-xs text-muted-foreground">or</span>
        <Button size="sm" variant="outline" className="text-xs h-7" onClick={onUpload}>
          <Link2 className="h-3 w-3 mr-1" /> Paste Link
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">PDF, DOC, PNG, JPG • Max 10MB</p>
    </div>
  );
};

const AdminDeals = () => {
  const posthog = usePostHog();
  const queryClient = useQueryClient();

  // Fetch deals from API - LIVE DATA
  const { data: apiDeals = [], isLoading } = useQuery({
    queryKey: ['admin-deals'],
    queryFn: () => adminService.getDeals(),
  });

  // Local state for deals - syncs with API data
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Sync local state when API data changes
  React.useEffect(() => {
    if (apiDeals.length > 0) {
      setDeals(apiDeals as unknown as Deal[]);
    }
  }, [apiDeals]);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  // Flag issue form
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagType, setFlagType] = useState("rate_below_market");
  const [flagDetails, setFlagDetails] = useState("The offered rate is below the market range for this region and role.");

  // Negotiating form
  const [counterRateInput, setCounterRateInput] = useState("10");
  const [counterHoursInput, setCounterHoursInput] = useState("40");
  const [counterMsgInput, setCounterMsgInput] = useState("I appreciate the offer but was hoping for a rate closer to $10/hr given my experience.");

  // Decline form
  const [declineReason, setDeclineReason] = useState("Rate too low");
  const [declineNotes, setDeclineNotes] = useState("Candidate found another position with better compensation.");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [showNegotiateForm, setShowNegotiateForm] = useState(false);

  // ============================================
  // MUTATIONS - Real API calls
  // ============================================

  const approveMutation = useMutation({
    mutationFn: (dealId: string) => adminService.approveDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Offer approved");
    },
  });

  const presentMutation = useMutation({
    mutationFn: (dealId: string) => adminService.presentDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Offer presented to candidate");
    },
  });

  const flagMutation = useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: { issueType: string; details: string } }) =>
      adminService.flagDeal(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Issue flagged — sent to client for revision");
    },
  });

  const candidateResponseMutation = useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: any }) =>
      adminService.recordCandidateResponse(dealId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      if (variables.data.response === 'accepted') {
        toast.success("🎉 Candidate accepted the offer!");
      } else if (variables.data.response === 'negotiating') {
        toast.success("Counter-offer sent to client");
      } else {
        toast.success("Candidate response recorded");
      }
    },
  });

  const completeDealMutation = useMutation({
    mutationFn: (dealId: string) => adminService.completeDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Deal closed! Candidate marked as hired.");
    },
  });

  // ============================================
  // FINALIZATION MUTATIONS
  // ============================================

  // Invoice & Payment
  const generateInvoiceMutation = useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: { amount: number; invoiceNumber: string; description?: string } }) =>
      adminService.generateInvoice(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Invoice generated & sent");
    },
  });

  const uploadInvoiceMutation = useMutation({
    mutationFn: ({ dealId, file }: { dealId: string; file: File }) =>
      adminService.uploadInvoiceFile(dealId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Invoice file uploaded");
    },
  });

  const markPaymentReceivedMutation = useMutation({
    mutationFn: ({ dealId, data }: {
      dealId: string;
      data: {
        transactionId: string;
        amount: number;
        method: 'bank_transfer' | 'credit_card' | 'stripe' | 'other';
        paidAt?: string;
      }
    }) => adminService.markPaymentReceived(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Payment marked as received");
    },
  });

  // Contract
  const generateContractMutation = useMutation({
    mutationFn: (dealId: string) => adminService.generateContract(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Contract generated & sent to both parties");
    },
  });

  const uploadContractMutation = useMutation({
    mutationFn: ({ dealId, file }: { dealId: string; file: File }) =>
      adminService.uploadContractFile(dealId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Contract file uploaded");
    },
  });

  const markContractSignedMutation = useMutation({
    mutationFn: async (dealId: string) => {
      // Call both endpoints in sequence
      await adminService.markClientSigned(dealId);
      await adminService.markCandidateSigned(dealId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Contract marked as fully signed");
    },
  });

  // Payroll
  const setupPayrollMutation = useMutation({
    mutationFn: ({ dealId, data }: {
      dealId: string;
      data: {
        partner: string;
        reference: string;
        bankDetails: boolean;
        scheduleConfigured: boolean;
        firstPayDate: string;
        notes: string;
      }
    }) => adminService.setupPayroll(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Payroll setup complete");
    },
  });

  // Compliance
  const uploadComplianceMutation = useMutation({
    mutationFn: ({ dealId, file }: { dealId: string; file: File }) =>
      adminService.uploadComplianceDoc(dealId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Compliance document uploaded");
    },
  });

  const verifyComplianceMutation = useMutation({
    mutationFn: ({ dealId, data }: {
      dealId: string;
      data: {
        taxClassification: boolean;
        laborRequirements: boolean;
        privacyRequirements: boolean;
        notes: string;
      }
    }) => adminService.verifyCompliance(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Compliance verified");
    },
  });

  // CSM
  const assignCSMMutation = useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: { name: string } }) =>
      adminService.assignCSM(dealId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success(`CSM assigned: ${variables.data.name}. Client notified.`);
    },
  });

  // Start Date
  const confirmStartDateMutation = useMutation({
    mutationFn: ({ dealId, data }: {
      dealId: string;
      data: {
        candidateConfirmed: boolean;
        clientConfirmed: boolean;
        notes: string;
      }
    }) => adminService.confirmStartDate(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast.success("Start date confirmed");
    },
  });

  // ============================================
  // FILE UPLOAD HANDLERS
  // ============================================

  const handleInvoiceUpload = (dealId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadInvoiceMutation.mutate({ dealId, file });
      }
    };
    input.click();
  };

  const handleContractUpload = (dealId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadContractMutation.mutate({ dealId, file });
      }
    };
    input.click();
  };

  const handleComplianceUpload = (dealId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadComplianceMutation.mutate({ dealId, file });
      }
    };
    input.click();
  };

  const getActionText = (deal: Deal): string => {
    if (deal.offerFlagged && deal.stage === "offer") return "⚠️ Waiting for client revision";

    if (deal.stage === "offer") {
      const status = deal.offer?.status;
      if (status === "sent" || status === "under_review") {
        return deal.offerApproved ? (deal.presented ? "✅ Approved & presented" : "⚡ Present to candidate") : "⚡ Review & present offer";
      }
      if (status === "presented") return "⏳ Awaiting candidate response";
      if (status === "accepted") return "⚡ Send invoice & generate contract";
      if (status === "negotiating") return "🔄 Counter-offer in progress";
      if (status === "declined") return "❌ Offer declined";
      return "⚡ Review & present offer";
    }

    if (deal.stage === "finalizing") {
      const f = deal.finalizing;
      if (!f) return "🔄 0 of 5 setup steps complete";
      const done = [f.paymentReceived, f.contractFullySigned, f.payrollComplete, f.complianceVerified, f.csmAssigned].filter(Boolean).length;
      return `🔄 ${done} of 5 setup steps complete`;
    }

    if (deal.stage === "hired") return `✅ Deal closed`;

    return "";
  };

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    setDeals((prev) => prev.map((d) => d.id === id ? { ...d, ...updates } : d));
    setSelectedDeal((prev) => prev?.id === id ? { ...prev, ...updates } as Deal : prev);
  };

  const updateFinalizing = (id: string, updates: Partial<FinalizingState>, timelineEvent?: string) => {
    setDeals((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const newFinalizing = { ...d.finalizing, ...updates };
      const newTimeline = timelineEvent ? [...d.timeline, { date: "Jan 25", event: timelineEvent }] : d.timeline;
      return { ...d, finalizing: newFinalizing, timeline: newTimeline };
    }));
    setSelectedDeal((prev) => {
      if (prev?.id !== id) return prev;
      const newFinalizing = { ...prev.finalizing, ...updates };
      const newTimeline = timelineEvent ? [...prev.timeline, { date: "Jan 25", event: timelineEvent }] : prev.timeline;
      return { ...prev, finalizing: newFinalizing, timeline: newTimeline };
    });
  };

  const handleApproveOffer = (deal: Deal) => {
    posthog.capture('admin_offer_approved', {
      deal_id: deal.id,
      company: deal.company,
      candidate: deal.candidate,
      rate: deal.rate,
      role: deal.role
    });
    approveMutation.mutate(deal.id);
  };

  const handleFlagIssue = (deal: Deal) => {
    if (!flagType) return;
    flagMutation.mutate({
      dealId: deal.id,
      data: { issueType: flagType, details: flagDetails }
    });
    setShowFlagForm(false);
    setFlagType("");
    setFlagDetails("");
  };

  const handlePresent = (deal: Deal) => {
    posthog.capture('admin_deal_presented', {
      deal_id: deal.id,
      company: deal.company,
      candidate: deal.candidate,
      role: deal.role
    });
    presentMutation.mutate(deal.id);
  };

  const handleCandidateAccepted = (deal: Deal) => {
    posthog.capture('admin_candidate_accepted_offer', {
      deal_id: deal.id,
      company: deal.company,
      candidate: deal.candidate,
      rate: deal.rate
    });
    candidateResponseMutation.mutate({
      dealId: deal.id,
      data: { response: 'accepted' }
    });
  };

  const handleSendCounter = (deal: Deal) => {
    posthog.capture('admin_counter_offer_sent', {
      deal_id: deal.id,
      company: deal.company,
      candidate: deal.candidate,
      original_rate: deal.rate,
      counter_rate: Number(counterRateInput)
    });
    candidateResponseMutation.mutate({
      dealId: deal.id,
      data: {
        response: 'negotiating',
        counterRate: Number(counterRateInput),
        counterHours: counterHoursInput ? Number(counterHoursInput) : undefined,
        counterMessage: counterMsgInput
      }
    });
    setShowNegotiateForm(false);
    setCounterRateInput("");
    setCounterHoursInput("40");
    setCounterMsgInput("");
  };

  const handleDecline = (deal: Deal) => {
    posthog.capture('admin_candidate_declined_offer', {
      deal_id: deal.id,
      company: deal.company,
      candidate: deal.candidate,
      decline_reason: declineReason
    });
    candidateResponseMutation.mutate({
      dealId: deal.id,
      data: {
        response: 'declined',
        declineReason,
        declineNotes
      }
    });
    setShowDeclineForm(false);
    setDeclineReason("");
    setDeclineNotes("");
  };

  const handleMarkHired = (deal: Deal) => {
    posthog.capture('admin_deal_completed', {
      deal_id: deal.id,
      company: deal.company,
      candidate: deal.candidate,
      role: deal.role,
      rate: deal.rate,
      invoice_amount: deal.finalizing.invoiceAmount
    });
    completeDealMutation.mutate(deal.id);
  };

  const currentDeal = selectedDeal ? deals.find((d) => d.id === selectedDeal.id) || null : null;

  const stageOrderForStepper = ["new_offers", "presented", "accepted", "in_progress", "completed"] as const;

  // Helper: Map deal stage to frontend column key for stepper
  // API returns frontend stage names directly
  const getCurrentStepperStage = (deal: Deal): DealStage => {
    const stage = deal.stage as string;

    // API already returns frontend stage names
    if (stage === "new_offers") return "new_offers";
    if (stage === "presented") return "presented";
    if (stage === "accepted") return "accepted";
    if (stage === "in_progress") return "in_progress";
    if (stage === "completed") return "completed";

    // Fallback to new_offers if stage is unrecognized
    return "new_offers";
  };

  const toggleStage = (dealId: string, stage: string) => {
    const key = `${dealId}-${stage}`;
    setExpandedStages((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderDealStepper = (deal: Deal) => {
    const currentStepperStage = getCurrentStepperStage(deal);
    const currentIdx = stageOrderForStepper.indexOf(currentStepperStage);

    return (
      <div className="space-y-0">
        {stageOrderForStepper.map((stage, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          const col = stageColumns.find((c) => c.key === stage)!;
          const expandKey = `${deal.id}-${stage}`;
          const isExpanded = isCurrent || expandedStages[expandKey];

          return (
            <div key={stage} className="relative">
              {i < stageOrderForStepper.length - 1 && (
                <div className={`absolute left-[11px] top-6 w-0.5 h-full ${isCompleted ? "bg-emerald-400" : isCurrent ? "bg-gradient-to-b from-primary to-transparent" : ""}`}
                  style={isFuture ? { borderLeft: "1px dashed hsl(var(--muted-foreground) / 0.2)" } : {}} />
              )}

              <div
                className={`relative z-10 flex items-center gap-3 py-2 ${isCompleted ? "cursor-pointer hover:bg-muted/50 rounded-lg px-1 -mx-1" : ""}`}
                onClick={() => isCompleted && toggleStage(deal.id, stage)}
              >
                {isCompleted ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20 bg-background shrink-0" />
                )}
                <span className={`text-sm font-medium ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground/40"}`}>
                  {col.label} {isCurrent && <span className="text-xs text-primary/60">(Current)</span>}
                  {isCompleted && <span className="text-xs text-muted-foreground ml-1">▸ click to review</span>}
                </span>
              </div>

              {/* Current / Expanded content */}
              {isExpanded && (
                <div className={`ml-9 pb-4 ${isCurrent ? "bg-primary/5 rounded-lg p-3 -ml-1 pl-10 mb-2" : "bg-muted/30 rounded-lg p-3 -ml-1 pl-10 mb-2"}`}>
                  {renderStageContent(deal, stage, isCompleted)}
                </div>
              )}

              {/* Collapsed summary for completed */}
              {isCompleted && !isExpanded && (
                <div className="ml-9 pb-3">
                  <p className="text-xs text-muted-foreground">
                    {stage === "new_offers" && `Offer reviewed & approved ✅`}
                    {stage === "presented" && `Presented to ${deal.candidate} — ${deal.presentedDate} ✅`}
                    {stage === "accepted" && `${deal.candidate} accepted ✅`}
                    {stage === "in_progress" && "All setup steps completed ✅"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStageContent = (deal: Deal, stage: string, readOnly: boolean) => {
    if (stage === "new_offers") {
      if (readOnly) {
        return (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Offer: ${deal.rate}/hr • {deal.hours} hrs/week • {getAvailabilityLabel(deal.type)}</p>
            <p>Start: {deal.startDate}</p>
            {deal.hmMessage && <p className="italic">"{deal.hmMessage}"</p>}
            <p className="text-emerald-600">✅ Offer Approved</p>
            {deal.offer?.negotiationHistory && deal.offer.negotiationHistory.length > 1 && (
              <p className="text-xs text-amber-600">
                🔄 {deal.offer.negotiationHistory.length} negotiation rounds
              </p>
            )}
          </div>
        );
      }
      return (
        <div className="space-y-3">
          {/* Step 1: Review Offer */}
          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">── Offer from Client ──</p>
            <div className="space-y-1 text-sm">
              <p className="text-foreground">Rate: <span className="font-semibold">${deal.rate}/hr</span></p>
              <p className="text-foreground">Hours: {deal.hours}/week ({getAvailabilityLabel(deal.type)})</p>
              <p className="text-foreground">Start Date: {deal.startDate}</p>
              {deal.hmMessage && <p className="text-muted-foreground italic mt-1">"{deal.hmMessage}"</p>}
            </div>
          </div>

          <div className="bg-muted rounded-lg p-2.5 space-y-1">
            <p className="text-xs font-semibold text-foreground">── Market Check ──</p>
            <p className="text-xs text-muted-foreground">Region: Latin America ({deal.candidateRegion})</p>
            <p className="text-xs text-muted-foreground">Role: {deal.role}</p>
            <p className="text-xs text-muted-foreground">Market Rate Range: $7 — $12/hr</p>
            <p className="text-xs text-muted-foreground">Offered Rate: ${deal.rate}/hr</p>
            <p className="text-xs text-emerald-600">✅ Within market range</p>
          </div>

          {/* Revised Offer Notification (during negotiation) */}
          {deal.offer?.negotiationHistory && deal.offer.negotiationHistory.length > 1 &&
           (deal.offer.status === 'sent' || deal.offer.status === 'under_review') && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800">🔄 Revised Offer (Round {deal.offer.negotiationHistory.length})</p>
              <p className="text-xs text-amber-700 mt-1">
                This is a revised offer during negotiation. Review changes below.
              </p>
              <div className="mt-2 bg-white rounded p-2">
                <p className="text-xs font-medium text-foreground mb-1">Latest Negotiation Round:</p>
                {deal.offer.negotiationHistory.slice(-2).reverse().map((round, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    <span className="font-medium">{round.actor === 'company' ? '🏢 Client' : '👤 Candidate'}:</span> ${round.rate}/hr
                    {round.hoursPerWeek && ` • ${round.hoursPerWeek} hrs/week`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {deal.offerFlagged ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800">⚠️ Issue Flagged — Sent to client for revision</p>
              <p className="text-xs text-amber-700 mt-1">Issue: {deal.flagIssueType}</p>
              {deal.flagDetails && <p className="text-xs text-amber-600 mt-1">{deal.flagDetails}</p>}
            </div>
          ) : !deal.offerApproved ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Step 1: Review Offer</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleApproveOffer(deal)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Approve Offer ✓
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-50 hidden" onClick={() => setShowFlagForm(true)}>⚠️ Flag Issue</Button>
              </div>
              {showFlagForm && (
                <div className="bg-card border border-border rounded-lg p-3 space-y-2 mt-2">
                  <p className="text-xs font-semibold text-foreground">── Flag Issue with Offer ──</p>
                  <div>
                    <Label className="text-xs">Issue Type</Label>
                    <Select value={flagType} onValueChange={setFlagType}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rate_below_market">Rate below market range</SelectItem>
                        <SelectItem value="rate_above_budget">Rate above budget</SelectItem>
                        <SelectItem value="hours_below_minimum">Hours below 20hr minimum</SelectItem>
                        <SelectItem value="start_date_too_soon">Start date too soon</SelectItem>
                        <SelectItem value="missing_information">Missing information</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Details</Label>
                    <Textarea className="mt-1 text-sm" value={flagDetails} onChange={(e) => setFlagDetails(e.target.value)} rows={3} placeholder="Explain the issue..." />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowFlagForm(false)} disabled={flagMutation.isPending}>Cancel</Button>
                    <Button size="sm" className="text-xs h-7" onClick={() => handleFlagIssue(deal)} disabled={flagMutation.isPending}>
                      {flagMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Send to Client →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : !deal.presented ? (
            <div className="space-y-3">
              <p className="text-xs text-emerald-600 font-medium">✅ Offer Approved</p>
              <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Step 2: Present to Candidate</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Contact: {deal.candidate}</p>
                  <p>Email: {deal.candidateEmail}</p>
                  <p>Region: {deal.candidateRegion}</p>
                </div>
                <div className="bg-muted rounded-lg p-2 mt-2">
                  <p className="text-xs font-medium text-foreground mb-1">Suggested talking points:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                    <li>Rate: ${deal.rate}/hr (matches listed rate)</li>
                    <li>{getAvailabilityLabel(deal.type)}, {deal.hours} hrs/week</li>
                    <li>Starting {deal.startDate}</li>
                    <li>Working with {deal.company}</li>
                  </ul>
                </div>
                <Button size="sm" className="text-xs h-8 w-full" onClick={() => handlePresent(deal)} disabled={presentMutation.isPending}>
                  {presentMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Mark as Presented →
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-emerald-600">✅ Offer Approved</p>
              <p className="text-xs text-emerald-600">✅ Presented to {deal.candidate} — {deal.presentedDate}</p>
            </div>
          )}
        </div>
      );
    }

    if (stage === "presented") {
      if (readOnly) {
        return (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Presented to {deal.candidate} on {deal.presentedDate}</p>
            <p className="text-emerald-600">Response: {deal.candidateResponse === "accepted" ? "Accepted ✅" : deal.candidateResponse}</p>
          </div>
        );
      }
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Waiting for {deal.candidate}'s response...</p>

          {deal.candidateResponse === "negotiating" && deal.counterRate ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-800">🔄 Counter-offer sent to client</p>
                <p className="text-xs text-amber-700 mt-1">{deal.candidate} requested ${deal.counterRate}/hr</p>
                {deal.counterMessage && <p className="text-xs text-amber-600 mt-1 italic">"{deal.counterMessage}"</p>}
              </div>

              {/* Negotiation History */}
              {deal.offer?.negotiationHistory && deal.offer.negotiationHistory.length > 1 && (
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Negotiation History ({deal.offer.negotiationHistory.length} rounds)</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {deal.offer.negotiationHistory.map((round, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg p-2 text-xs ${
                          round.actor === 'company' ? 'bg-blue-50 border border-blue-200' : 'bg-amber-50 border border-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {round.actor === 'company' ? '🏢 Client' : '👤 Candidate'} — Round {round.round}
                          </span>
                          {round.action === 'initial_offer' && <span className="text-[10px] text-muted-foreground">(Initial Offer)</span>}
                          {round.action === 'counter_offer' && <span className="text-[10px] text-muted-foreground">(Counter-Offer)</span>}
                          {round.action === 'revised_offer' && <span className="text-[10px] text-muted-foreground">(Revised Offer)</span>}
                          {round.action === 'accepted_counter' && <span className="text-[10px] text-muted-foreground">(Accepted Counter)</span>}
                        </div>
                        <p className={round.actor === 'company' ? 'text-blue-700' : 'text-amber-700'}>
                          ${round.rate}/hr
                          {round.hoursPerWeek && ` • ${round.hoursPerWeek} hrs/week`}
                        </p>
                        {round.message && <p className="italic text-muted-foreground mt-1">"{round.message}"</p>}
                        {round.presentedAt && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Presented: {formatDateTime(round.presentedAt)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : deal.candidateResponse === "declined" ? (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-destructive">❌ {deal.candidate} declined</p>
              <p className="text-xs text-muted-foreground mt-1">Reason: {deal.declineReason}</p>
              {deal.declineNotes && <p className="text-xs text-muted-foreground italic">{deal.declineNotes}</p>}
            </div>
          ) : (
            <>
              <div className="bg-card rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-foreground mb-2">Step 3: Record Candidate Response</p>
                <p className="text-xs text-muted-foreground mb-3">How did {deal.candidate} respond?</p>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleCandidateAccepted(deal)} disabled={candidateResponseMutation.isPending}>
                    {candidateResponseMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    ✅ Accepted
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setShowNegotiateForm(true)} disabled={candidateResponseMutation.isPending}>🔄 Negotiating</Button>
                  <Button size="sm" variant="outline" className="text-xs h-8 text-destructive border-destructive/30" onClick={() => setShowDeclineForm(true)} disabled={candidateResponseMutation.isPending}>❌ Declined</Button>
                </div>
              </div>

              {showNegotiateForm && (
                <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">── Counter-Offer Details (Round {(deal.offer?.negotiationHistory?.length || 0) + 1}) ──</p>
                  <p className="text-xs text-muted-foreground">What is {deal.candidate} requesting?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Counter Rate</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs">$</span>
                        <Input className="h-7 text-sm w-20" value={counterRateInput} onChange={(e) => setCounterRateInput(e.target.value)} placeholder="10" />
                        <span className="text-xs text-muted-foreground">/hr</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Counter Hours</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Input className="h-7 text-sm w-20" value={counterHoursInput} onChange={(e) => setCounterHoursInput(e.target.value)} />
                        <span className="text-xs text-muted-foreground">/week</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{deal.candidate}'s Reason / Message</Label>
                    <Textarea className="mt-1 text-sm" value={counterMsgInput} onChange={(e) => setCounterMsgInput(e.target.value)} rows={3} placeholder="I appreciate the offer..." />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowNegotiateForm(false)} disabled={candidateResponseMutation.isPending}>Cancel</Button>
                    <Button size="sm" className="text-xs h-7" onClick={() => handleSendCounter(deal)} disabled={candidateResponseMutation.isPending}>
                      {candidateResponseMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Send Counter to Client →
                    </Button>
                  </div>
                </div>
              )}

              {showDeclineForm && (
                <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">── Decline Details ──</p>
                  <div>
                    <Label className="text-xs">Reason for declining</Label>
                    <Select value={declineReason} onValueChange={setDeclineReason}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {["Accepted another position", "Rate too low", "Hours don't work", "Personal reasons", "Role not a good fit", "Other"].map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Additional notes</Label>
                    <Textarea className="mt-1 text-sm" value={declineNotes} onChange={(e) => setDeclineNotes(e.target.value)} rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowDeclineForm(false)} disabled={candidateResponseMutation.isPending}>Cancel</Button>
                    <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => handleDecline(deal)} disabled={candidateResponseMutation.isPending}>
                      {candidateResponseMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Confirm Decline →
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    if (stage === "accepted") {
      if (readOnly) {
        return <p className="text-sm text-emerald-600">{deal.candidate} accepted the offer ✅</p>;
      }
      return (
        <div className="space-y-2">
          <p className="text-xs text-emerald-600 font-medium">✅ {deal.candidate} accepted the offer</p>
          <p className="text-xs text-muted-foreground">Deal will automatically advance to finalizing.</p>
        </div>
      );
    }

    if (stage === "in_progress") {
      const f = deal.finalizing;
      const allDone = f.paymentReceived && f.contractFullySigned && f.payrollComplete && f.complianceVerified && f.csmAssigned;

      if (readOnly) {
        return (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>✅ Payment: ${f.invoiceAmount} received</p>
            <p>✅ Contract: Signed by both parties</p>
            <p>✅ Payroll: Setup complete</p>
            <p>✅ Compliance: Verified</p>
            <p>✅ CSM: {f.csmName} assigned</p>
            <p>✅ Start Date: {deal.startDate} confirmed</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {/* Sub-step 1: Invoice & Payment */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {f.paymentReceived ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded border border-muted-foreground/30 shrink-0" />}
              <p className="text-sm font-medium text-foreground">1. Placement Fee</p>
            </div>
            {f.paymentReceived ? (
              <div className="ml-6 bg-emerald-500/5 rounded-lg p-2.5 space-y-1">
                <p className="text-xs text-emerald-600">✅ Payment Received</p>
                <p className="text-xs text-muted-foreground">Amount: ${f.invoiceAmount} • Ref: {f.paymentRef}</p>
                {f.invoiceFile && (
                  <div className="flex items-center gap-1 text-xs">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="text-foreground">{f.invoiceFile.name}</span>
                    <button onClick={() => toast.info("File preview — available in production")} className="text-primary hover:underline ml-1">View ↗</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-6 space-y-2">
                {!f.invoiceGenerated ? (
                  <>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Invoice Amount ($) *</Label>
                        <Input
                          className="mt-1 h-7 text-sm"
                          type="number"
                          value={f.invoiceAmount}
                          onChange={(e) => updateFinalizing(deal.id, { invoiceAmount: e.target.value })}
                          placeholder="2500.00"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Invoice number will be auto-generated
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs">Description (optional)</Label>
                        <Input
                          className="mt-1 h-7 text-sm"
                          value={f.invoiceDescription}
                          onChange={(e) => updateFinalizing(deal.id, { invoiceDescription: e.target.value })}
                          placeholder="One-time placement fee"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="text-xs h-7"
                      disabled={!f.invoiceAmount || parseFloat(f.invoiceAmount) <= 0 || generateInvoiceMutation.isPending}
                      onClick={() => {
                        generateInvoiceMutation.mutate({
                          dealId: deal.id,
                          data: {
                            amount: parseFloat(f.invoiceAmount),
                            description: f.invoiceDescription
                          }
                        });
                      }}
                    >
                      {generateInvoiceMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Generate & Send Invoice →
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 space-y-1">
                      <p className="text-xs text-blue-800 font-medium">✅ Invoice {f.invoiceId} generated</p>
                      <p className="text-xs text-blue-700">📧 Payment link sent via Stripe to {deal.company}</p>
                      <p className="text-xs text-muted-foreground">Amount: ${f.invoiceAmount}</p>
                    </div>
                    <FileUploadArea
                      file={f.invoiceFile}
                      onUpload={() => handleInvoiceUpload(deal.id)}
                      onRemove={() => updateFinalizing(deal.id, { invoiceFile: null })}
                      label="Attach Invoice PDF (optional)"
                    />
                    <div className="border-t border-border pt-2 mt-2">
                      <p className="text-xs font-medium text-foreground mb-1">💳 Payment Status</p>
                      <p className="text-xs text-amber-600 mb-2">⏳ Awaiting payment from client</p>
                      <div className="bg-muted/30 rounded-lg p-2 mb-2">
                        <p className="text-[10px] text-muted-foreground italic">
                          In production: Stripe webhook would auto-confirm payment. For this demo, simulate below.
                        </p>
                      </div>
                      <p className="text-xs font-medium text-foreground mb-1.5">Simulate Payment Received</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Payment Method *</Label>
                          <Select value={f.paymentMethod} onValueChange={(v) => updateFinalizing(deal.id, { paymentMethod: v })}>
                            <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stripe">Stripe</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Transaction ID *</Label>
                          <Input className="mt-1 h-7 text-xs" value={f.paymentRef} onChange={(e) => updateFinalizing(deal.id, { paymentRef: e.target.value })} placeholder="stripe_ch_abc123" />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="text-xs h-7 mt-2 bg-emerald-600 hover:bg-emerald-700"
                        disabled={!f.paymentMethod || !f.paymentRef || markPaymentReceivedMutation.isPending}
                        onClick={() => {
                          markPaymentReceivedMutation.mutate({
                            dealId: deal.id,
                            data: {
                              transactionId: f.paymentRef,
                              amount: parseFloat(f.invoiceAmount),
                              method: f.paymentMethod as 'bank_transfer' | 'credit_card' | 'stripe' | 'other'
                            }
                          });
                        }}
                      >
                        {markPaymentReceivedMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        Simulate Payment Received ✓
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sub-step 2: Contract */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {f.contractFullySigned ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded border border-muted-foreground/30 shrink-0" />}
              <p className="text-sm font-medium text-foreground">2. Employment Contract</p>
            </div>
            {f.contractFullySigned ? (
              <div className="ml-6 bg-emerald-500/5 rounded-lg p-2.5 space-y-1">
                <p className="text-xs text-emerald-600">✅ Contract Signed</p>
                <p className="text-xs text-muted-foreground">{f.contractId} • Client ✅ • Candidate ✅</p>
                {f.contractFile && (
                  <div className="flex items-center gap-1 text-xs">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="text-foreground">{f.contractFile.name}</span>
                    <button onClick={() => toast.info("File preview — available in production")} className="text-primary hover:underline ml-1">View ↗</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-6 space-y-2">
                <p className="text-xs text-muted-foreground">Parties: {deal.company} (via RL) ↔ {deal.candidate}</p>
                {!f.contractGenerated ? (
                  <Button size="sm" className="text-xs h-7" onClick={() => {
                    generateContractMutation.mutate(deal.id);
                  }} disabled={generateContractMutation.isPending}>
                    {generateContractMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Generate Contract →
                  </Button>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 space-y-1">
                      <p className="text-xs text-blue-800 font-medium">✅ Contract {f.contractId} generated</p>
                      <p className="text-xs text-blue-700">📧 Sent via DocuSign to both parties</p>
                    </div>
                    <FileUploadArea
                      file={f.contractFile}
                      onUpload={() => handleContractUpload(deal.id)}
                      onRemove={() => updateFinalizing(deal.id, { contractFile: null })}
                      label="Attach Signed Contract PDF (optional)"
                    />
                    <div className="border-t border-border pt-2 mt-2">
                      <p className="text-xs font-medium text-foreground mb-1.5">📝 Signing Status</p>
                      <div className="space-y-1 text-xs mb-2">
                        <p>{f.clientSigned ? "✅" : "⏳"} Client ({deal.company}): {f.clientSigned ? "Signed" : "Awaiting signature"}</p>
                        <p>{f.candidateSigned ? "✅" : "⏳"} Candidate ({deal.candidate}): {f.candidateSigned ? "Signed" : "Awaiting signature"}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2 mb-2">
                        <p className="text-[10px] text-muted-foreground italic">
                          In production: DocuSign webhooks would auto-update signature status. For this demo, simulate below.
                        </p>
                      </div>
                      <p className="text-xs font-medium text-foreground mb-2">Simulate Signing</p>
                      <div className="flex gap-2">
                        {!f.clientSigned && false&& (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                            // Simulate client signed (call individual endpoint)
                            adminService.markClientSigned(deal.id).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
                              toast.success("Client signature simulated");
                            });
                          }}>
                            Client Signed ✓
                          </Button>
                        )}
                        {!f.candidateSigned && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => {
                              // Simulate candidate signed (call individual endpoint)
                              adminService.markCandidateSigned(deal.id).then(() => {
                                queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
                                toast.success("Candidate signature simulated");
                              });
                            }}
                            disabled={markContractSignedMutation.isPending}
                          >
                            {markContractSignedMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            Candidate Signed ✓
                          </Button>
                        )}
                        {!f.clientSigned && !f.candidateSigned && false && (
                          <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                            markContractSignedMutation.mutate(deal.id);
                          }}>
                            Both Signed ✓
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sub-step 3: Payroll */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {f.payrollComplete ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded border border-muted-foreground/30 shrink-0" />}
              <p className="text-sm font-medium text-foreground">3. Payroll Setup</p>
            </div>
            {f.payrollComplete ? (
              <div className="ml-6 bg-emerald-500/5 rounded-lg p-2.5 space-y-1">
                <p className="text-xs text-emerald-600">✅ Payroll Setup Complete</p>
                <p className="text-xs text-muted-foreground">Partner: {formatPayrollPartner(f.payrollPartner)} • First Pay: {f.payrollFirstPay}</p>
              </div>
            ) : (
              <div className="ml-6 space-y-2">
                <div className="bg-muted/30 rounded-lg p-2 mb-2">
                  <p className="text-[10px] text-muted-foreground italic">
                    Set up the VA's profile in your payroll partner's system, then confirm completion below.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Payroll Partner *</Label>
                    <Select value={f.payrollPartner} onValueChange={(v) => updateFinalizing(deal.id, { payrollPartner: v })}>
                      <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rl_partner">RL Payroll Partner</SelectItem>
                        <SelectItem value="deel">Deel</SelectItem>
                        <SelectItem value="remote_com">Remote.com</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Profile Reference *</Label>
                    <Input className="mt-1 h-7 text-xs" value={f.payrollRef} onChange={(e) => updateFinalizing(deal.id, { payrollRef: e.target.value })} placeholder="deel_maria_2025" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground mb-1">Confirm setup completed in {formatPayrollPartner(f.payrollPartner || 'payroll system')}:</p>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={f.payrollBankDetails} onChange={() => updateFinalizing(deal.id, { payrollBankDetails: !f.payrollBankDetails })} className="accent-primary" />
                    VA bank account details collected
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={f.payrollSchedule} onChange={() => updateFinalizing(deal.id, { payrollSchedule: !f.payrollSchedule })} className="accent-primary" />
                    Payment schedule configured (bi-weekly/monthly)
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <Label className="text-xs">First pay date *</Label>
                    <Input type="date" className="h-7 text-xs w-40" value={f.payrollFirstPay} onChange={(e) => updateFinalizing(deal.id, { payrollFirstPay: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Notes (e.g., Profile ID, setup details)</Label>
                  <Textarea
                    className="mt-1 text-xs"
                    rows={2}
                    value={f.payrollNotes}
                    onChange={(e) => updateFinalizing(deal.id, { payrollNotes: e.target.value })}
                    placeholder="Profile created in Deel. Contractor classification confirmed. Bi-weekly schedule configured."
                  />
                </div>
                <Button
                  size="sm"
                  className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!f.payrollPartner || !f.payrollRef || !f.payrollBankDetails || !f.payrollSchedule || setupPayrollMutation.isPending}
                  onClick={() => {
                    // Convert date to ISO datetime format if provided
                    const firstPayDateISO = f.payrollFirstPay
                      ? new Date(f.payrollFirstPay).toISOString()
                      : undefined;

                    setupPayrollMutation.mutate({
                      dealId: deal.id,
                      data: {
                        partner: f.payrollPartner,
                        reference: f.payrollRef,
                        bankDetails: f.payrollBankDetails,
                        scheduleConfigured: f.payrollSchedule,
                        firstPayDate: firstPayDateISO,
                        notes: f.payrollNotes,
                      }
                    });
                  }}
                >
                  {setupPayrollMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Mark Payroll Setup Complete ✓
                </Button>
              </div>
            )}
          </div>

          {/* Sub-step 4: Compliance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {f.complianceVerified ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded border border-muted-foreground/30 shrink-0" />}
              <p className="text-sm font-medium text-foreground">4. Compliance Verification</p>
            </div>
            {f.complianceVerified ? (
              <div className="ml-6 bg-emerald-500/5 rounded-lg p-2.5 space-y-1">
                <p className="text-xs text-emerald-600">✅ Compliance Verified</p>
                <p className="text-xs text-muted-foreground">Classification: Independent Contractor • {deal.candidateRegion} ✅</p>
              </div>
            ) : (
              <div className="ml-6 space-y-2">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={f.complianceTax} onChange={() => updateFinalizing(deal.id, { complianceTax: !f.complianceTax })} className="accent-primary" />
                    Tax classification confirmed (Contractor)
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={f.complianceLabor} onChange={() => updateFinalizing(deal.id, { complianceLabor: !f.complianceLabor })} className="accent-primary" />
                    Country-specific labor requirements met
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={f.compliancePrivacy} onChange={() => updateFinalizing(deal.id, { compliancePrivacy: !f.compliancePrivacy })} className="accent-primary" />
                    Data protection / privacy requirements met
                  </label>
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea className="mt-1 text-xs" rows={2} value={f.complianceNotes} onChange={(e) => updateFinalizing(deal.id, { complianceNotes: e.target.value })} />
                </div>
                <FileUploadArea
                  file={f.complianceFile}
                  onUpload={() => handleComplianceUpload(deal.id)}
                  onRemove={() => updateFinalizing(deal.id, { complianceFile: null })}
                  label="Attach compliance docs (optional)"
                />
                <Button
                  size="sm"
                  className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    verifyComplianceMutation.mutate({
                      dealId: deal.id,
                      data: {
                        taxClassification: f.complianceTax,
                        laborRequirements: f.complianceLabor,
                        privacyRequirements: f.compliancePrivacy,
                        notes: f.complianceNotes,
                      }
                    });
                  }}
                  disabled={verifyComplianceMutation.isPending}
                >
                  {verifyComplianceMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Mark All Verified ✓
                </Button>
              </div>
            )}
          </div>

          {/* Sub-step 5: CSM */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {f.csmAssigned ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded border border-muted-foreground/30 shrink-0" />}
              <p className="text-sm font-medium text-foreground">5. Customer Success Manager</p>
            </div>
            {f.csmAssigned ? (
              <div className="ml-6 bg-emerald-500/5 rounded-lg p-2.5 space-y-1">
                <p className="text-xs text-emerald-600">✅ CSM Assigned</p>
                <p className="text-xs text-muted-foreground">CSM: {f.csmName}</p>
                <p className="text-xs text-muted-foreground">Client notified ✅</p>
              </div>
            ) : (
              <div className="ml-6 space-y-2">
                <div>
                  <Label className="text-xs">Assign CSM</Label>
                  <Select value={f.csmName} onValueChange={(v) => updateFinalizing(deal.id, { csmName: v })}>
                    <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue placeholder="Select CSM..." /></SelectTrigger>
                    <SelectContent>
                      {csmOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-muted rounded-lg p-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">CSM will help with:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Onboarding guidance</li>
                    <li>Performance tracking setup</li>
                    <li>Training support</li>
                    <li>Ongoing account management</li>
                  </ul>
                </div>
                <Button
                  size="sm"
                  className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!f.csmName || assignCSMMutation.isPending}
                  onClick={() => {
                    assignCSMMutation.mutate({
                      dealId: deal.id,
                      data: { name: f.csmName }
                    });
                  }}
                >
                  {assignCSMMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Assign & Notify Client ✓
                </Button>
              </div>
            )}
          </div>

          {/* All done */}
          {allDone && (
            <div className="bg-emerald-500/10 rounded-lg p-4 text-center space-y-2">
              <p className="text-base font-semibold text-emerald-600">🎉 All finalizing steps complete!</p>
              <div className="text-left space-y-1 text-xs text-muted-foreground">
                <p>✅ Payment: ${f.invoiceAmount} received</p>
                <p>✅ Contract: Signed by both parties</p>
                <p>✅ Payroll: Setup complete, first pay {f.payrollFirstPay}</p>
                <p>✅ Compliance: Verified</p>
                <p>✅ CSM: {f.csmName} assigned</p>
              </div>
              <Button
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleMarkHired(deal)}
                disabled={completeDealMutation.isPending}
              >
                {completeDealMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                ✅ Close Deal — Mark as Hired
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (stage === "completed") {
      const f = deal.finalizing;
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-emerald-600">✅ Deal Completed</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Revenue: ${f.invoiceAmount} (placement fee)</p>
            <p>CSM: {f.csmName || "—"}</p>
            <p>🛡️ Guarantee: 6-month replacement</p>
            <p>🎟️ 30% discount unlocked for {deal.company}'s next hire</p>
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-xs font-semibold text-foreground mb-1">Full Deal Timeline</p>
            <div className="space-y-1">
              {deal.timeline.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground w-20 shrink-0">{formatDateTime(t.date)}:</span>
                  <span className="text-foreground">{t.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="px-6 lg:px-8 max-w-full">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Active Deals</h1>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-64 shrink-0 bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-5 h-5 rounded-full" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="w-full h-24 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4 mt-6 min-h-[calc(100vh-180px)]">
        {stageColumns.map((col) => {
          // Filter by stage field (API returns frontend stage names)
          let colDeals: Deal[] = [];
          if (col.key === "new_offers") {
            colDeals = deals.filter(d => d.stage === 'new_offers');
          } else if (col.key === "presented") {
            colDeals = deals.filter(d => d.stage === 'presented');
          } else if (col.key === "accepted") {
            colDeals = deals.filter(d => d.stage === 'accepted');
          } else if (col.key === "in_progress") {
            colDeals = deals.filter(d => d.stage === 'in_progress');
          } else if (col.key === "completed") {
            colDeals = deals.filter(d => d.stage === 'completed');
          }

          return (
            <div key={col.key} className="w-64 shrink-0 bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-sm font-semibold text-foreground">{col.label}</span>
                <span className="w-5 h-5 bg-muted text-muted-foreground rounded-full text-xs flex items-center justify-center font-medium">{colDeals.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {colDeals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => {
                      posthog.capture('admin_deal_opened', {
                        deal_id: deal.id,
                        stage: deal.stage,
                        company: deal.company,
                        candidate: deal.candidate
                      });
                      setSelectedDeal(deal);
                    }}
                    className="bg-card rounded-lg border border-border p-3 cursor-pointer hover:shadow-sm transition-shadow border-l-2 group"
                  >
                    <p className="text-sm font-semibold text-foreground">{deal.company}</p>
                    <p className="text-xs text-muted-foreground">→ {deal.candidate}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{deal.role} • ${deal.rate}/hr</p>
                    <p className="text-xs text-amber-600 mt-2">{getActionText(deal)}</p>
                    <p className="text-xs text-muted-foreground text-right mt-1">{deal.updated}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Deal Slide-Over */}
      {currentDeal && (
        <>
          <div className="fixed inset-0 bg-foreground/20 z-50" onClick={() => setSelectedDeal(null)} />
          <div className="fixed right-0 top-0 h-full w-[480px] max-w-full bg-card shadow-2xl z-50 animate-slide-in-right flex flex-col">
            <div className="p-5 border-b border-border shrink-0">
              <button onClick={() => setSelectedDeal(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
              <p className="text-sm text-muted-foreground">{currentDeal.company}</p>
              <h2 className="text-lg font-semibold text-foreground">→ {currentDeal.candidate}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{currentDeal.role} • ${currentDeal.rate}/hr • {getAvailabilityLabel(currentDeal.type)}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {renderDealStepper(currentDeal)}

              {/* Timeline */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-foreground mb-2">Timeline</p>
                <div className="space-y-1.5">
                  {[...currentDeal.timeline].reverse().map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground">{t.event}</span>
                      <span className="text-muted-foreground ml-auto">{formatDateTime(t.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDeals;
