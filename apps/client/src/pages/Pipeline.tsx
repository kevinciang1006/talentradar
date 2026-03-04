import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, Calendar, FileText, CheckCircle2, Shield, Inbox } from "lucide-react";
import { SlideOverPanel } from "@/components/pipeline/SlideOverPanel";
import { jobService } from "@/services/job.service";
import { pipelineService } from "@/services/pipeline.service";
import { PIPELINE_STAGE_CONFIG, REJECTION_REASON_OPTIONS } from "@/utils/constants";
import type { PipelineEntry, Job, Talent } from "@/types/api";
import { formatDateShort } from "@/utils/dateFormatters";

const pipelineStages = ["shortlisted", "screening", "interview", "offer", "finalizing", "hired"] as const;

// Map constants to format expected by Pipeline component
const stageConfig: Record<string, { label: string; color: string; borderColor: string }> = {
  shortlisted: {
    label: PIPELINE_STAGE_CONFIG.shortlisted.label,
    color: "bg-blue-500",
    borderColor: "border-l-blue-500"
  },
  screening: {
    label: PIPELINE_STAGE_CONFIG.screening.label,
    color: "bg-purple-500",
    borderColor: "border-l-purple-500"
  },
  interview: {
    label: PIPELINE_STAGE_CONFIG.interview.label,
    color: "bg-amber-500",
    borderColor: "border-l-amber-500"
  },
  offer: {
    label: PIPELINE_STAGE_CONFIG.offer.label,
    color: "bg-orange-500",
    borderColor: "border-l-orange-500"
  },
  finalizing: {
    label: PIPELINE_STAGE_CONFIG.finalizing.label,
    color: "bg-teal-500",
    borderColor: "border-l-teal-500"
  },
  hired: {
    label: PIPELINE_STAGE_CONFIG.hired.label,
    color: "bg-emerald-500",
    borderColor: "border-l-emerald-500"
  },
  rejected: {
    label: PIPELINE_STAGE_CONFIG.rejected.label,
    color: "bg-red-500",
    borderColor: "border-l-red-500"
  },
};

const Pipeline = () => {
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedCard, setSelectedCard] = useState<PipelineEntry | null>(null);
  const [showRejected, setShowRejected] = useState(false);

  // Rejection modal
  const [rejectModal, setRejectModal] = useState<PipelineEntry | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");

  // Fetch all jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobService.list(),
  });

  // Auto-select first job when jobs load
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0]._id);
    }
  }, [jobs, selectedJob]);

  // Fetch pipeline entries for selected job
  const { data: pipelineData, isLoading: entriesLoading, refetch: refetchPipeline } = useQuery({
    queryKey: ['pipeline', selectedJob],
    queryFn: () => pipelineService.getByJob(selectedJob),
    enabled: !!selectedJob,
  });

  // Ensure entries is always an array
  const entries = Array.isArray(pipelineData) ? pipelineData : [];

  const activeEntries = entries.filter((e) => e.stage !== "rejected");
  const rejectedEntries = entries.filter((e) => e.stage === "rejected");

  const getStageEntries = (stage: string) => activeEntries.filter((e) => e.stage === stage);

  // Refresh pipeline after any update
  const refreshPipeline = async () => {
    const result = await refetchPipeline();
    // Update selected card with the fresh data from the refetch
    if (selectedCard && result.data) {
      const updatedEntries = Array.isArray(result.data) ? result.data : [];
      const updatedEntry = updatedEntries.find((e) => e._id === selectedCard._id);
      setSelectedCard(updatedEntry || null);
    }
  };

  const moveToStage = async (entryId: string, newStage: string) => {
    try {
      await pipelineService.updateStage(entryId, newStage);
      toast.success(`Moved to ${stageConfig[newStage]?.label || newStage}`);
      await refreshPipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update stage');
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await pipelineService.updateStage(rejectModal._id, 'rejected', rejectReason);
      toast.success('Candidate rejected');
      setRejectModal(null);
      setRejectReason("");
      setRejectNotes("");
      setSelectedCard(null);
      await refreshPipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to reject candidate');
    }
  };

  const handleRejectFromPanel = async (entryId: string, reason: string, notes?: string) => {
    try {
      await pipelineService.reject(entryId, reason, notes);
      toast.success('Candidate rejected');
      setSelectedCard(null);
      await refreshPipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to reject candidate');
    }
  };

  const handleAddNote = async (entryId: string, content: string) => {
    try {
      await pipelineService.addNote(entryId, content);
      toast.success('Note added');
      await refreshPipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add note');
    }
  };

  const handleAssignTask = async (entryId: string, data: { title: string; description: string; dueDate: string }) => {
    try {
      await pipelineService.assignScreeningTask(entryId, data);
      toast.success('Screening task assigned');
      await refreshPipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to assign task');
    }
  };

  const handleScheduleInterview = async (entryId: string, data: {
    scheduledAt: string; candidateTimezone: string; meetingLink: string; notes?: string;
  }) => {
    try {
      await pipelineService.scheduleInterview(entryId, data);
      toast.success('Interview scheduled');
      await refreshPipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to schedule interview');
    }
  };

  const handleInterviewComplete = async (entryId: string, notes?: string) => {
    try {
      await pipelineService.updateInterviewStatus(entryId, 'completed', notes);
      toast.success('Interview marked as completed');
      await refreshPipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update interview');
    }
  };

  const handleSendOffer = async (entryId: string, data: {
    rate: number; hoursPerWeek: number; type: string; startDate: string; message?: string;
  }) => {
    try {
      await pipelineService.createOffer(entryId, data);
      toast.success('Offer sent');
      await refreshPipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to send offer');
    }
  };

  const handleCompletePayment = async (entryId: string, method: string, transactionId: string) => {
    try {
      await pipelineService.completePayment(entryId, { method, transactionId });
      toast.success('Payment completed');
      await refreshPipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to process payment');
    }
  };

  const handleSignContract = async (entryId: string) => {
    try {
      await pipelineService.signContract(entryId);
      toast.success('Contract signed');
      await refreshPipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to sign contract');
    }
  };

  // Get the current entry from state
  const currentEntry = useMemo(() => {
    return selectedCard ? entries.find((e) => e._id === selectedCard._id) || null : null;
  }, [selectedCard, entries]);

  // Get the current job for the selected entry
  const currentJob = useMemo(() => {
    if (!currentEntry) return null;
    const jobId = typeof currentEntry.jobId === 'string' ? currentEntry.jobId : (currentEntry.jobId as Job)._id;
    return jobs.find(j => j._id === jobId) || null;
  }, [currentEntry, jobs]);

  const renderCard = (entry: PipelineEntry) => {
    const config = stageConfig[entry.stage];
    const talent = entry.talentId as Talent;

    // Look up job from jobs list (jobId might be a string or populated Job object)
    const jobId = typeof entry.jobId === 'string' ? entry.jobId : (entry.jobId as Job)._id;
    const job = jobs.find(j => j._id === jobId);

    if (!job) return null; // Skip if job not found

    // Get initials from talent name
    const initials = talent.firstName && talent.lastName
      ? `${talent.firstName[0]}${talent.lastName[0]}`.toUpperCase()
      : (talent.fullName || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Format time in stage
    const createdDate = new Date(entry.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const timeInStage = diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day' : `${diffDays} days`;

    return (
      <div
        key={entry._id}
        onClick={() => setSelectedCard(entry)}
        className={`bg-card rounded-lg border border-border p-3 cursor-pointer hover:shadow-sm transition-shadow border-l-2 ${config.borderColor} group`}
      >
        <div className="flex items-center gap-2">
          {talent.avatar ? (
            <img src={talent.avatar} alt={talent.fullName || talent.firstName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
              {initials}
            </div>
          )}
          <span className="text-sm font-medium text-foreground truncate flex-1">
            {talent.fullName || `${talent.firstName} ${talent.lastName}`}
          </span>
          {entry.stage === "hired" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-10">{job.title}</p>
        <div className="flex items-center justify-between mt-1 ml-10">
          <span className="text-xs font-semibold text-emerald-600">${talent.hourlyRate}/hr</span>
          <span className="text-xs text-muted-foreground">{talent.region?.replace('_', ' ')}</span>
        </div>

        {/* Stage-specific info */}
        {entry.stage === "interview" && entry.interview && (
          <div className="mt-2 ml-10 flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" /> {formatDateShort(entry.interview.scheduledAt)}
          </div>
        )}
        {entry.stage === "offer" && entry.offer && (
          <div className="mt-2 ml-10 flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" /> Offer: {entry.offer.status.charAt(0).toUpperCase() + entry.offer.status.slice(1).replace(/_/g, " ")}
          </div>
        )}
        {entry.stage === "finalizing" && entry.finalization && (
          <div className="mt-2 ml-10">
            <div className="flex items-center gap-1">
              <div className="flex-1 bg-muted rounded-full h-1.5">
                <div className="bg-[hsl(172,66%,50%)] rounded-full h-1.5 transition-all" style={{ width: `${(
                  [
                    entry.finalization.payment.status === 'paid',
                    entry.finalization.contract.status === 'signed',
                    entry.finalization.payroll.status === 'complete',
                    entry.finalization.compliance.status === 'verified',
                    entry.finalization.csm.status === 'assigned',
                    entry.finalization.startDate.status === 'confirmed'
                  ].filter(Boolean).length / 6) * 100}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">
                {[
                  entry.finalization.payment.status === 'paid',
                  entry.finalization.contract.status === 'signed',
                  entry.finalization.payroll.status === 'complete',
                  entry.finalization.compliance.status === 'verified',
                  entry.finalization.csm.status === 'assigned',
                  entry.finalization.startDate.status === 'confirmed'
                ].filter(Boolean).length}/6
              </span>
            </div>
          </div>
        )}
        {entry.stage === "hired" && (
          <div className="mt-2 ml-10 flex items-center gap-1 text-xs text-emerald-600">
            <Shield className="h-3 w-3" /> Active
          </div>
        )}

        <div className="flex items-center justify-end mt-1">
          <span className="text-xs text-muted-foreground">{timeInStage}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="px-6 lg:px-8 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto">
        <h1 className="text-xl font-semibold text-foreground">Hiring Pipeline</h1>
        <div className="flex items-center gap-4">
          {jobsLoading ? (
            <Skeleton className="h-10 w-72" />
          ) : jobs.length > 0 ? (
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job._id} value={job._id}>
                    {job.title} ({job.candidateCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground">No jobs created yet</div>
          )}
          {rejectedEntries.length > 0 && (
            <button onClick={() => setShowRejected(!showRejected)} className="text-sm text-muted-foreground hover:text-foreground">
              {rejectedEntries.length} rejected
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 max-w-7xl mx-auto">
        {pipelineStages.map((stage) => (
          <div key={stage} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${stageConfig[stage].color}`} />
            <span className="text-xs text-muted-foreground">{stageConfig[stage].label}</span>
          </div>
        ))}
      </div>

      {/* Rejected list */}
      {showRejected && (
        <div className="max-w-7xl mx-auto mt-4 bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Rejected Candidates</h3>
          <div className="space-y-2">
            {rejectedEntries.map((e) => {
              const talent = e.talentId as Talent;

              // Look up job from jobs list
              const jobId = typeof e.jobId === 'string' ? e.jobId : (e.jobId as Job)._id;
              const job = jobs.find(j => j._id === jobId);

              if (!job) return null;

              const initials = talent.firstName && talent.lastName
                ? `${talent.firstName[0]}${talent.lastName[0]}`.toUpperCase()
                : (talent.fullName || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

              return (
                <div key={e._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    {talent.avatar ? (
                      <img src={talent.avatar} alt={talent.fullName || talent.firstName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-xs font-semibold">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-foreground">{talent.fullName || `${talent.firstName} ${talent.lastName}`}</p>
                      <p className="text-xs text-muted-foreground">{job.title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{e.rejection?.reason || 'No reason provided'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading / Empty state / Kanban */}
      {entriesLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 mt-4">
          {pipelineStages.map((stage) => (
            <div key={stage} className="w-64 shrink-0 bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${stageConfig[stage].color}`} />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : activeEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-semibold text-foreground">No candidates in this pipeline yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">Browse the talent pool to start shortlisting candidates for this role.</p>
          <Button className="mt-4" asChild><Link to="/talent">Browse Talent Pool →</Link></Button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 mt-4 min-h-[calc(100vh-220px)]">
          {pipelineStages.map((stage) => {
            const stageEntries = getStageEntries(stage);
            return (
              <div key={stage} className="w-64 shrink-0 bg-muted/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stageConfig[stage].color}`} />
                    <span className="text-sm font-semibold text-foreground">{stageConfig[stage].label}</span>
                    <span className="w-5 h-5 bg-muted text-muted-foreground rounded-full text-xs flex items-center justify-center font-medium">
                      {stageEntries.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {stageEntries.map(renderCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Panel */}
      {currentEntry && currentJob && (
        <SlideOverPanel
          entry={currentEntry}
          job={currentJob}
          onClose={() => setSelectedCard(null)}
          onMoveToStage={moveToStage}
          onReject={(entryId, reason, notes) => handleRejectFromPanel(entryId, reason, notes)}
          onAddNote={handleAddNote}
          onAssignTask={handleAssignTask}
          onScheduleInterview={handleScheduleInterview}
          onInterviewComplete={handleInterviewComplete}
          onSendOffer={handleSendOffer}
          onCompletePayment={handleCompletePayment}
          onSignContract={handleSignContract}
        />
      )}

      {/* Rejection Modal */}
      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>❌ Reject Candidate</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Remove {rejectModal?.name} from the pipeline?</p>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Reason</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a reason..." /></SelectTrigger>
                <SelectContent>
                  {REJECTION_REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea className="mt-1" value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectModal(null)}>Keep in Pipeline</Button>
              <Button variant="destructive" onClick={handleReject}>Reject →</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pipeline;
