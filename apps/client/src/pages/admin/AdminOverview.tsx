import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { adminService } from "@/services/admin.service";
import type { AdminDashboardStats, PipelineEntry } from "@/types/api";
import { getAvailabilityLabel } from "@/utils/constants";
import { formatRelativeTime, formatDateShort, formatDateLong } from "@/utils/dateFormatters";

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

// Helper to determine action type and what to do based on deal stage
const getActionTypeAndTodo = (deal: PipelineEntry): { type: string; whatToDo: string } => {
  // Admin deals use different stage values than company pipeline
  const stage = deal.stage as string;

  // Check if offer needs approval (new_offers stage or not yet approved)
  if (stage === 'new_offers' || (!deal.offerApproved && stage === 'presented')) {
    return {
      type: "🔵 NEW OFFER — Review Required",
      whatToDo: "Review the offer terms and approve or flag for issues."
    };
  }

  // Check if offer is approved but not presented
  if (deal.offerApproved && !deal.presented) {
    return {
      type: "🟡 OFFER APPROVED — Needs Presentation",
      whatToDo: "Present the approved offer to the candidate."
    };
  }

  // Check if offer is accepted and in finalization
  if (deal.candidateResponse === 'accepted' && stage === 'in_progress') {
    const f = deal.finalizing;

    // Invoice not generated
    if (!f?.invoiceGenerated) {
      return {
        type: "💰 INVOICE NEEDED",
        whatToDo: "Generate and send invoice for placement fee."
      };
    }

    // Payment not received
    if (f.invoiceGenerated && !f.paymentReceived) {
      return {
        type: "⏳ AWAITING PAYMENT",
        whatToDo: "Follow up on payment status for the placement fee."
      };
    }

    // Contract not generated
    if (f.paymentReceived && !f.contractGenerated) {
      return {
        type: "📄 CONTRACT NEEDED",
        whatToDo: "Generate employment contract and send to both parties."
      };
    }

    // Contract not fully signed
    if (f.contractGenerated && !f.contractFullySigned) {
      return {
        type: "✍️ CONTRACT SIGNATURES PENDING",
        whatToDo: "Follow up on contract signatures from client and candidate."
      };
    }

    // Payroll not complete
    if (f.contractFullySigned && !f.payrollComplete) {
      return {
        type: "💼 PAYROLL SETUP NEEDED",
        whatToDo: "Configure payroll with partner and collect candidate banking details."
      };
    }

    // Compliance not verified
    if (f.payrollComplete && !f.complianceVerified) {
      return {
        type: "✅ COMPLIANCE VERIFICATION NEEDED",
        whatToDo: "Verify tax classification, labor laws, and privacy requirements."
      };
    }

    // CSM not assigned
    if (f.complianceVerified && !f.csmAssigned) {
      return {
        type: "👤 CSM ASSIGNMENT NEEDED",
        whatToDo: "Assign a Customer Success Manager to this placement."
      };
    }

    // Start date not confirmed
    if (f.csmAssigned && !f.startDateConfirmed) {
      return {
        type: "📅 START DATE CONFIRMATION NEEDED",
        whatToDo: "Confirm start date with both client and candidate."
      };
    }

    // All finalization steps complete - ready to mark as hired
    if (f.startDateConfirmed) {
      return {
        type: "🎉 READY TO COMPLETE",
        whatToDo: "All onboarding steps complete. Mark this deal as hired."
      };
    }
  }

  // Offer is flagged
  if (deal.offerFlagged) {
    return {
      type: "🚩 OFFER FLAGGED",
      whatToDo: `Resolve flagged issue: ${deal.flagIssueType || 'Review required'}`
    };
  }

  // Candidate is negotiating
  if (deal.candidateResponse === 'negotiating') {
    return {
      type: "💬 COUNTER-OFFER RECEIVED",
      whatToDo: "Review candidate's counter-offer and discuss with hiring manager."
    };
  }

  // Default fallback
  return {
    type: "📋 ACTION REQUIRED",
    whatToDo: "Review this deal and take appropriate action."
  };
};

const AdminOverview = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [actionItems, setActionItems] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, actionsData] = await Promise.all([
          adminService.getStats(),
          adminService.getActionRequired()
        ]);
        setStats(statsData);
        setActionItems(actionsData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch admin overview data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = stats ? [
    { icon: Users, label: "Active Deals", value: stats.activeDeals.toString(), bg: "bg-foreground text-background border-foreground/50" },
    { icon: AlertCircle, label: "Action Required", value: stats.actionRequired.toString(), bg: "bg-foreground text-background border-foreground/50", dot: stats.actionRequired > 0 },
    { icon: TrendingUp, label: "Hires This Month", value: stats.hiresThisMonth.toString(), bg: "bg-foreground text-background border-foreground/50" },
    { icon: DollarSign, label: "Revenue This Month", value: formatCurrency(stats.revenueThisMonth), bg: "bg-foreground text-background border-foreground/50" },
  ] : [];

  if (loading) {
    return (
      <div className="px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 border border-destructive/20">
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="px-6 lg:px-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">{formatDateLong(new Date())}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.bg}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-70">{s.label}</span>
              {s.dot && <span className="w-2 h-2 rounded-full bg-destructive" />}
            </div>
            <p className="text-3xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Action Required */}
      <div className="bg-card rounded-xl border border-border p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-semibold text-foreground">🔔 Requires Your Action</span>
          <span className="w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-medium">
            {actionItems.length}
          </span>
        </div>
        {actionItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No action items at this time.</p>
        ) : (
          <div className="space-y-4">
            {actionItems.map((item) => {
              const { type, whatToDo } = getActionTypeAndTodo(item);
              const typeLabel = getAvailabilityLabel(item.type || 'full_time');
              const details = `${item.role} • $${item.rate}/hr • ${typeLabel}${item.startDate ? ' • Start: ' + formatDateShort(item.startDate) : ''}`;

              return (
                <div key={item._id} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">{type}</span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(item.updatedAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.company} → {item.candidate}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{details}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="font-medium text-foreground">What to do: </span>{whatToDo}
                  </p>
                  <div className="mt-3">
                    <Button size="sm" className="text-xs h-8" asChild>
                      <Link to={`/admin/deals?id=${item._id}`}>Open Deal →</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;
