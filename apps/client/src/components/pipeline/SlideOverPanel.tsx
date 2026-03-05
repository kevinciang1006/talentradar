import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, CheckCircle2, ExternalLink, Shield, Calendar, FileText, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PipelineEntry, Job, Talent } from "@/types/api";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/utils/dateFormatters";
import { REJECTION_REASON_OPTIONS } from "@/utils/constants";
import { pipelineService } from "@/services/pipeline.service";

const stageConfig: Record<string, { label: string; color: string; borderColor: string }> = {
  shortlisted: { label: "Shortlisted", color: "bg-blue-500", borderColor: "border-l-blue-500" },
  screening: { label: "Screening", color: "bg-purple-500", borderColor: "border-l-purple-500" },
  interview: { label: "Interview", color: "bg-amber-500", borderColor: "border-l-amber-500" },
  offer: { label: "Offer", color: "bg-orange-500", borderColor: "border-l-orange-500" },
  finalizing: { label: "Finalizing", color: "bg-teal-500", borderColor: "border-l-teal-500" },
  hired: { label: "Hired", color: "bg-emerald-500", borderColor: "border-l-emerald-500" },
  rejected: { label: "Rejected", color: "bg-red-500", borderColor: "border-l-red-500" },
};

const stageOrder = ["shortlisted", "screening", "interview", "offer", "finalizing", "hired"] as const;

interface SlideOverPanelProps {
  entry: PipelineEntry;
  job: Job;
  onClose: () => void;
  onMoveToStage: (entryId: string, stage: string) => Promise<void>;
  onReject: (entryId: string, reason: string, notes?: string) => Promise<void>;
  onAddNote: (entryId: string, content: string) => Promise<void>;
  onAssignTask: (entryId: string, data: { title: string; description: string; dueDate: string }) => Promise<void>;
  onScheduleInterview: (entryId: string, data: { scheduledAt: string; candidateTimezone: string; meetingLink: string; notes?: string }) => Promise<void>;
  onInterviewComplete: (entryId: string, notes?: string) => Promise<void>;
  onSendOffer: (entryId: string, data: { rate: number; hoursPerWeek: number; type: string; startDate: string; message?: string }) => Promise<void>;
  onCompletePayment: (entryId: string, method: string, transactionId: string) => Promise<void>;
  onSignContract: (entryId: string) => Promise<void>;
}

export const SlideOverPanel = ({
  entry,
  job,
  onClose,
  onMoveToStage,
  onReject,
  onAddNote,
  onAssignTask,
  onScheduleInterview,
  onInterviewComplete,
  onSendOffer,
  onCompletePayment,
  onSignContract,
}: SlideOverPanelProps) => {
  const talent = entry.talentId as Talent;
  const talentName = `${talent.firstName} ${talent.lastName}`;
  const talentInitials = `${talent.firstName[0]}${talent.lastName[0]}`.toUpperCase();

  const [note, setNote] = useState("");
  const [expandedStage, setExpandedStage] = useState<string | null>(entry.stage);

  // Loading states for async actions
  const [isMovingStage, setIsMovingStage] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAssigningTask, setIsAssigningTask] = useState(false);
  const [isSchedulingInterview, setIsSchedulingInterview] = useState(false);
  const [isCompletingInterview, setIsCompletingInterview] = useState(false);
  const [isSendingOffer, setIsSendingOffer] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSigningContract, setIsSigningContract] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAcceptingCounter, setIsAcceptingCounter] = useState(false);
  const [isRevisingOffer, setIsRevisingOffer] = useState(false);
  const [isDecliningCounter, setIsDecliningCounter] = useState(false);

  // Auto-expand current stage when it changes
  useEffect(() => {
    setExpandedStage(entry.stage);
  }, [entry.stage]);

  // Screening task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskLink, setTaskLink] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");

  // Interview form
  const [intDateTime, setIntDateTime] = useState("");
  const [intTimezone, setIntTimezone] = useState("America/New_York");
  const [intLink, setIntLink] = useState("");
  const [intNotes, setIntNotes] = useState("");

  // Offer form
  const [offRate, setOffRate] = useState(String(talent.hourlyRate || ""));
  const [offHours, setOffHours] = useState("40");
  const [offType, setOffType] = useState("full_time");
  const [offStart, setOffStart] = useState("");
  const [offMsg, setOffMsg] = useState("");

  // Interview notes
  const [interviewNotesText, setInterviewNotesText] = useState("");

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [paymentTransactionId, setPaymentTransactionId] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Contract modal
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractAgreed, setContractAgreed] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("skills_mismatch");
  const [rejectNotes, setRejectNotes] = useState("");

  // Negotiation state
  const [showReviseForm, setShowReviseForm] = useState(false);
  const [reviseRate, setReviseRate] = useState("");
  const [reviseHours, setReviseHours] = useState("");
  const [reviseMessage, setReviseMessage] = useState("");
  const [showDeclineCounterForm, setShowDeclineCounterForm] = useState(false);
  const [declineCounterReason, setDeclineCounterReason] = useState("");

  const currentIdx = stageOrder.indexOf(entry.stage as any);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setIsAddingNote(true);
    try {
      await onAddNote(entry._id, note);
      setNote("");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleSendTask = async () => {
    if (!taskTitle.trim() || !taskDue) {
      toast.error("Please fill in all task fields");
      return;
    }

    // Convert datetime-local format to ISO 8601
    const dueDateISO = new Date(taskDue).toISOString();

    setIsAssigningTask(true);
    try {
      await onAssignTask(entry._id, {
        title: taskTitle,
        description: taskDesc,
        dueDate: dueDateISO,
        taskLink,
        submissionLink,
      });
      setShowTaskForm(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskDue("");
      setTaskLink("");
      setSubmissionLink("");
    } finally {
      setIsAssigningTask(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!intDateTime || !intLink) {
      toast.error("Please fill in date/time and meeting link");
      return;
    }

    // Convert datetime-local format to ISO 8601
    const scheduledAtISO = new Date(intDateTime).toISOString();

    setIsSchedulingInterview(true);
    try {
      await onScheduleInterview(entry._id, {
        scheduledAt: scheduledAtISO,
        candidateTimezone: intTimezone,
        meetingLink: intLink,
        notes: intNotes,
      });
      setIntDateTime("");
      setIntLink("");
      setIntNotes("");
    } finally {
      setIsSchedulingInterview(false);
    }
  };

  const handleMarkInterviewComplete = async () => {
    setIsCompletingInterview(true);
    try {
      await onInterviewComplete(entry._id, interviewNotesText);
      setInterviewNotesText("");
    } finally {
      setIsCompletingInterview(false);
    }
  };

  const handleSendOffer = async () => {
    if (!offRate || !offStart) {
      toast.error("Please fill in rate and start date");
      return;
    }

    // Convert datetime-local format to ISO 8601
    const startDateISO = new Date(offStart).toISOString();

    setIsSendingOffer(true);
    try {
      await onSendOffer(entry._id, {
        rate: Number(offRate),
        hoursPerWeek: Number(offHours),
        type: offType,
        startDate: startDateISO,
        message: offMsg,
      });
      setOffMsg("");
    } finally {
      setIsSendingOffer(false);
    }
  };

  const handleProcessPayment = () => {
    setIsProcessingPayment(true);
    // Simulate payment processing
    setTimeout(() => {
      setPaymentSuccess(true);
      setIsProcessingPayment(false);
    }, 1000);
  };

  const handlePaymentDone = async () => {
    setIsProcessingPayment(true);
    try {
      await onCompletePayment(entry._id, paymentMethod, `TXN-${Date.now()}`);
      setShowPaymentModal(false);
      setPaymentSuccess(false);
      setPaymentMethod("stripe");
      setPaymentTransactionId("");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSignContractAction = () => {
    setContractSigned(true);
  };

  const handleContractDone = async () => {
    setIsSigningContract(true);
    try {
      await onSignContract(entry._id);
      setShowContractModal(false);
      setContractSigned(false);
      setContractAgreed(false);
    } finally {
      setIsSigningContract(false);
    }
  };

  const handleRejectCandidate = async () => {
    if (!rejectReason) {
      toast.error("Please select a rejection reason");
      return;
    }
    setIsRejecting(true);
    try {
      await onReject(entry._id, rejectReason, rejectNotes);
      setShowRejectModal(false);
      onClose();
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAcceptCounter = async () => {
    setIsAcceptingCounter(true);
    try {
      await pipelineService.acceptCounterOffer(entry._id);
      toast.success("Counter-offer accepted! Remote Leverage will review.");
    } catch (error) {
      toast.error("Failed to accept counter-offer");
    } finally {
      setIsAcceptingCounter(false);
    }
  };

  const handleReviseOffer = async () => {
    if (!reviseRate) {
      toast.error("Please enter a rate");
      return;
    }

    setIsRevisingOffer(true);
    try {
      await pipelineService.reviseOffer(entry._id, {
        rate: Number(reviseRate),
        hoursPerWeek: reviseHours ? Number(reviseHours) : undefined,
        message: reviseMessage,
      });
      toast.success("Revised offer submitted for approval");
      setShowReviseForm(false);
      setReviseRate("");
      setReviseHours("");
      setReviseMessage("");
    } catch (error) {
      toast.error("Failed to submit revised offer");
    } finally {
      setIsRevisingOffer(false);
    }
  };

  const handleDeclineCounter = async () => {
    if (!declineCounterReason) {
      toast.error("Please provide a reason");
      return;
    }

    setIsDecliningCounter(true);
    try {
      await pipelineService.declineCounterOffer(entry._id, declineCounterReason);
      toast.success("Counter-offer declined");
      setShowDeclineCounterForm(false);
      setDeclineCounterReason("");
      onClose();
    } catch (error) {
      toast.error("Failed to decline counter-offer");
    } finally {
      setIsDecliningCounter(false);
    }
  };

  const getMainAction = () => {
    switch (entry.stage) {
      case "shortlisted":
        return {
          label: "Move to Screening →",
          onClick: () => {
            setIsMovingStage(true);
            onMoveToStage(entry._id, "screening").finally(() => setIsMovingStage(false));
          },
          variant: "default" as const,
          disabled: isMovingStage
        };
      case "screening":
        return {
          label: "Move to Interview →",
          onClick: () => {
            setIsMovingStage(true);
            onMoveToStage(entry._id, "interview").finally(() => setIsMovingStage(false));
          },
          variant: "default" as const,
          disabled: isMovingStage
        };
      case "interview":
        if (entry.interview?.status === "completed") {
          return {
            label: "Move to Offer →",
            onClick: () => {
              setIsMovingStage(true);
              onMoveToStage(entry._id, "offer").finally(() => setIsMovingStage(false));
            },
            variant: "default" as const,
            disabled: isMovingStage
          };
        }
        return null;
      case "offer":
        if (entry.offer?.status === "accepted") {
          return {
            label: "Proceed to Finalizing →",
            onClick: () => {
              setIsMovingStage(true);
              onMoveToStage(entry._id, "finalizing").finally(() => setIsMovingStage(false));
            },
            variant: "default" as const,
            disabled: isMovingStage
          };
        }
        return null;
      case "finalizing":
        // Removed "Mark as Hired" - only admins can do this
        return null;
      case "hired":
        return null;
      default:
        return null;
    }
  };

  const renderStageContent = (stage: typeof stageOrder[number]) => {
    const isCompleted = stageOrder.indexOf(stage) < currentIdx;
    const isCurrent = stage === entry.stage;

    if (stage === "shortlisted") {
      const historyItem = entry.stageHistory.find((h) => h.to === "shortlisted");
      return (
        <p className="text-sm text-muted-foreground">
          Added to pipeline on {historyItem ? formatDate(historyItem.changedAt) : "recently"}
        </p>
      );
    }

    if (stage === "screening") {
      if (isCompleted || isCurrent) {
        return (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Vetting Report</p>
              <div className="space-y-1.5">
                {[
                  `English: ${talent.englishProficiency || "Fluent"}`,
                  "Skills Assessment Passed",
                  "Background Verified",
                  "Remote Work History Confirmed",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-amber-50 text-amber-700 rounded-lg px-2 py-1 font-medium">
                    ⭐ Remote Leverage Rating: Top 1%
                  </span>
                </div>
              </div>
            </div>

            {isCurrent && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Screening Task (Optional)</p>
                {entry.screeningTask ? (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm font-medium text-foreground">{entry.screeningTask.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {formatDate(entry.screeningTask.dueDate)}
                    </p>
                    {entry.screeningTask.taskLink && (
                      <a
                        href={entry.screeningTask.taskLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        <ExternalLink className="h-3 w-3" /> View Task
                      </a>
                    )}
                    {entry.screeningTask.submissionLink && (
                      <a
                        href={entry.screeningTask.submissionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <ExternalLink className="h-3 w-3" /> View Submission
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      Status: {entry.screeningTask.status}
                    </p>
                  </div>
                ) : showTaskForm ? (
                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    <div>
                      <Label className="text-xs">Task Title</Label>
                      <Input
                        className="mt-1 h-8 text-sm"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Organize this sample calendar"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        className="mt-1 text-sm"
                        value={taskDesc}
                        onChange={(e) => setTaskDesc(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Task Link (Optional)</Label>
                      <Input
                        className="mt-1 h-8 text-sm"
                        value={taskLink}
                        onChange={(e) => setTaskLink(e.target.value)}
                        placeholder="https://forms.gle/abc123"
                        type="url"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Submission Link (Optional)</Label>
                      <Input
                        className="mt-1 h-8 text-sm"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        placeholder="https://docs.google.com/..."
                        type="url"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Due Date & Time</Label>
                      <Input
                        type="datetime-local"
                        className="mt-1 h-8 text-sm"
                        value={taskDue}
                        onChange={(e) => setTaskDue(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => setShowTaskForm(false)}
                        disabled={isAssigningTask}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-7"
                        onClick={handleSendTask}
                        disabled={isAssigningTask}
                      >
                        {isAssigningTask && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        Send Task →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setShowTaskForm(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Assign Screening Task
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      }
    }

    if (stage === "interview") {
      if (isCompleted) {
        return (
          <p className="text-sm text-muted-foreground">
            Interview completed
            {entry.interview?.notes && ` • "${entry.interview.notes.slice(0, 40)}..."`}
          </p>
        );
      }

      if (isCurrent) {
        if (entry.interview) {
          const isScheduled = entry.interview.status === "scheduled";
          const isCompleted = entry.interview.status === "completed";

          return (
            <div className="space-y-3">
              {isScheduled && (
                <>
                  <div className="bg-muted rounded-lg p-3 space-y-1.5">
                    <p className="text-sm font-medium text-foreground">
                      📅 {formatDateTime(entry.interview.scheduledAt)}
                    </p>
                    {entry.interview.meetingLink && (
                      <a
                        href={entry.interview.meetingLink}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Join Meeting
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span className="text-xs font-medium bg-warning/10 text-warning rounded-full px-2 py-0.5">
                      Scheduled
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="text-xs h-7 w-full"
                    onClick={handleMarkInterviewComplete}
                    disabled={isCompletingInterview}
                  >
                    {isCompletingInterview && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Mark Interview Complete ✓
                  </Button>
                </>
              )}

              {isCompleted && (
                <>
                  <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-success">✅ Interview Completed</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(entry.interview.scheduledAt)}
                    </p>
                  </div>
                  {entry.interview.notes && (
                    <div className="bg-muted rounded-lg p-2">
                      <p className="text-xs font-semibold text-foreground mb-1">Notes:</p>
                      <p className="text-sm text-muted-foreground">{entry.interview.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        }

        // No interview scheduled yet - show form
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">Schedule Interview</p>
            <div>
              <Label className="text-xs">Date & Time</Label>
              <Input
                type="datetime-local"
                className="mt-1 h-8 text-sm"
                value={intDateTime}
                onChange={(e) => setIntDateTime(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Candidate Timezone</Label>
              <Select value={intTimezone} onValueChange={setIntTimezone}>
                <SelectTrigger className="mt-1 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">EST</SelectItem>
                  <SelectItem value="America/Los_Angeles">PST</SelectItem>
                  <SelectItem value="America/Chicago">CST</SelectItem>
                  <SelectItem value="America/Bogota">COT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">🔗 Meeting Link</Label>
              <Input
                className="mt-1 h-8 text-sm"
                value={intLink}
                onChange={(e) => setIntLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div>
              <Label className="text-xs">📝 Notes (optional)</Label>
              <Textarea
                className="mt-1 text-sm"
                value={intNotes}
                onChange={(e) => setIntNotes(e.target.value)}
                rows={2}
                placeholder="Looking forward to meeting you!"
              />
            </div>
            <Button
              size="sm"
              className="text-xs h-7 w-full"
              onClick={handleScheduleInterview}
              disabled={isSchedulingInterview}
            >
              {isSchedulingInterview && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Schedule Interview →
            </Button>
          </div>
        );
      }
    }

    if (stage === "offer") {
      if (isCompleted && entry.offer) {
        return (
          <p className="text-sm text-muted-foreground">
            ${entry.offer.rate}/hr • {entry.offer.hoursPerWeek} hrs/week • {entry.offer.type}
          </p>
        );
      }

      if (isCurrent) {
        if (!entry.offer) {
          // Show offer creation form
          return (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Create Offer</p>
              <div>
                <Label className="text-xs">Rate</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    className="w-20 h-8 text-sm"
                    value={offRate}
                    onChange={(e) => setOffRate(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">/hr</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {talentName}'s listed rate: ${talent.hourlyRate}/hr
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Hours/Week</Label>
                  <Input
                    className="mt-1 h-8 text-sm"
                    value={offHours}
                    onChange={(e) => setOffHours(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={offType} onValueChange={setOffType}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Start Date & Time</Label>
                <Input
                  type="datetime-local"
                  className="mt-1 h-8 text-sm"
                  value={offStart}
                  onChange={(e) => setOffStart(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Message (optional)</Label>
                <Textarea
                  className="mt-1 text-sm"
                  value={offMsg}
                  onChange={(e) => setOffMsg(e.target.value)}
                  rows={2}
                  placeholder="Hi, we were impressed..."
                />
              </div>
              <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2">
                ℹ️ Remote Leverage will review and present this offer to the candidate.
              </p>
              <Button
                size="sm"
                className="text-xs h-7 w-full"
                onClick={handleSendOffer}
                disabled={isSendingOffer}
              >
                {isSendingOffer && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Send Offer →
              </Button>
            </div>
          );
        }

        // Offer exists - show status with negotiation support
        const isNegotiating = entry.offer.status === 'negotiating';
        const isFlagged = entry.offer.status === 'flagged';
        const latestCounter = entry.offer.negotiationHistory
          ?.filter((r) => r.actor === 'candidate')
          ?.sort((a, b) => b.round - a.round)[0];
        const hasCounter = isNegotiating && latestCounter;

        return (
          <div className="space-y-3">
            {/* Original Offer Details */}
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">
                ${entry.offer.rate}/hr • {entry.offer.hoursPerWeek} hrs/week • {entry.offer.type}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start: {formatDate(entry.offer.startDate)}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <span className={`text-xs font-medium rounded-full px-2 py-0.5 capitalize ${
                isNegotiating ? 'bg-amber-100 text-amber-700' :
                isFlagged ? 'bg-red-100 text-red-700' :
                'bg-primary/10 text-primary'
              }`}>
                {entry.offer.status === 'pending_approval' ? 'Pending Approval' :
                 entry.offer.status === 'presented' ? 'Awaiting Response' :
                 entry.offer.status === 'negotiating' ? 'Negotiating' :
                 entry.offer.status}
              </span>
            </div>

            {/* Flag Notification */}
            {isFlagged && entry.offer.flagIssue && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-800 mb-1">
                  ⚠️ Issue Flagged by Remote Leverage
                </p>
                <p className="text-xs text-red-700 font-medium">{entry.offer.flagIssue.issueType}</p>
                <p className="text-xs text-red-600 mt-1">{entry.offer.flagIssue.details}</p>
                <Button
                  size="sm"
                  className="text-xs h-7 mt-2 w-full"
                  onClick={() => {
                    setReviseRate(String(entry.offer!.rate));
                    setReviseHours(String(entry.offer!.hoursPerWeek));
                    setShowReviseForm(true);
                  }}
                >
                  Revise Offer
                </Button>
              </div>
            )}

            {/* Counter-Offer Notification */}
            {hasCounter && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-800 mb-2">
                  🔄 Counter-Offer Received
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900">
                    ${latestCounter.rate}/hr
                    {latestCounter.hoursPerWeek && latestCounter.hoursPerWeek !== entry.offer.hoursPerWeek &&
                      ` • ${latestCounter.hoursPerWeek} hrs/week`
                    }
                  </p>
                  {latestCounter.message && (
                    <p className="text-xs text-amber-700 italic">"{latestCounter.message}"</p>
                  )}
                </div>

                {/* Counter-Offer Actions */}
                {!showReviseForm && !showDeclineCounterForm && (
                  <div className="mt-3 space-y-2">
                    <Button
                      size="sm"
                      className="text-xs h-7 w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleAcceptCounter}
                      disabled={isAcceptingCounter || isRevisingOffer || isDecliningCounter}
                    >
                      {isAcceptingCounter && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Accept Counter-Offer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 w-full"
                      onClick={() => {
                        setReviseRate(String(latestCounter.rate));
                        setReviseHours(latestCounter.hoursPerWeek ? String(latestCounter.hoursPerWeek) : "");
                        setShowReviseForm(true);
                      }}
                      disabled={isAcceptingCounter || isRevisingOffer || isDecliningCounter}
                    >
                      Send Revised Offer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 w-full text-destructive border-destructive/30"
                      onClick={() => setShowDeclineCounterForm(true)}
                      disabled={isAcceptingCounter || isRevisingOffer || isDecliningCounter}
                    >
                      Decline Counter-Offer
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Revise Offer Form */}
            {showReviseForm && (
              <div className="bg-card border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Revise Offer</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">New Rate</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs">$</span>
                      <Input
                        className="h-7 text-sm"
                        value={reviseRate}
                        onChange={(e) => setReviseRate(e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">/hr</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Hours/Week</Label>
                    <Input
                      className="h-7 text-sm mt-1"
                      value={reviseHours}
                      onChange={(e) => setReviseHours(e.target.value)}
                      placeholder={String(entry.offer.hoursPerWeek)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Message (optional)</Label>
                  <Textarea
                    className="mt-1 text-sm"
                    value={reviseMessage}
                    onChange={(e) => setReviseMessage(e.target.value)}
                    rows={2}
                    placeholder="Thank you for the counter-offer..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => {
                      setShowReviseForm(false);
                      setReviseRate("");
                      setReviseHours("");
                      setReviseMessage("");
                    }}
                    disabled={isRevisingOffer}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleReviseOffer}
                    disabled={isRevisingOffer}
                  >
                    {isRevisingOffer && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Submit Revised Offer →
                  </Button>
                </div>
              </div>
            )}

            {/* Decline Counter Form */}
            {showDeclineCounterForm && (
              <div className="bg-card border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Decline Counter-Offer</p>
                <div>
                  <Label className="text-xs">Reason</Label>
                  <Textarea
                    className="mt-1 text-sm"
                    value={declineCounterReason}
                    onChange={(e) => setDeclineCounterReason(e.target.value)}
                    rows={2}
                    placeholder="Exceeds our budget..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => {
                      setShowDeclineCounterForm(false);
                      setDeclineCounterReason("");
                    }}
                    disabled={isDecliningCounter}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs h-7"
                    onClick={handleDeclineCounter}
                    disabled={isDecliningCounter}
                  >
                    {isDecliningCounter && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Confirm Decline
                  </Button>
                </div>
              </div>
            )}

            {/* Original Message */}
            {entry.offer.message && !hasCounter && !isFlagged && (
              <div className="bg-muted rounded-lg p-2">
                <p className="text-xs text-muted-foreground">{entry.offer.message}</p>
              </div>
            )}

            {/* Negotiation History Link */}
            {entry.offer.negotiationHistory && entry.offer.negotiationHistory.length > 1 && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {entry.offer.negotiationHistory.length} rounds of negotiation
                </p>
              </div>
            )}
          </div>
        );
      }
    }

    if (stage === "finalizing") {
      if (isCompleted) {
        return <p className="text-sm text-muted-foreground">All onboarding steps completed ✅</p>;
      }

      if (isCurrent) {
        // Check finalization status from entry.finalization object
        const finalization = entry.finalization;
        const paymentComplete = finalization?.payment?.status === 'paid';
        const contractComplete = finalization?.contract?.clientSigned;
        const invoiceGenerated = finalization?.payment?.invoiceId;
        const contractGenerated = finalization?.contract?.contractId;

        return (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-foreground">Completing Your Hire</p>

            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                YOUR ACTIONS
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Offer Accepted</span>
                </div>

                {/* Payment Step */}
                <div className="flex items-start gap-2 justify-between">
                  <div className="flex items-start gap-2">
                    {paymentComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 rounded border border-muted-foreground/30 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={`text-sm ${paymentComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Complete Payment
                      </span>
                      {paymentComplete ? (
                        <p className="text-xs text-emerald-600">✓ Payment of ${finalization?.payment?.amount || 2500} completed</p>
                      ) : invoiceGenerated ? (
                        <p className="text-xs text-muted-foreground/70">
                          Invoice {finalization?.payment?.invoiceId} • ${finalization?.payment?.amount || 2500}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600/70">⏳ Waiting for Remote Leverage to send invoice</p>
                      )}
                    </div>
                  </div>
                  {!paymentComplete && invoiceGenerated && (
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs h-6 px-2"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      Pay Invoice →
                    </Button>
                  )}
                </div>

                {/* Contract Step */}
                <div className="flex items-start gap-2 justify-between">
                  <div className="flex items-start gap-2">
                    {contractComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 rounded border border-muted-foreground/30 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={`text-sm ${contractComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Sign Contract
                      </span>
                      {contractComplete ? (
                        <p className="text-xs text-emerald-600">✓ Contract {finalization?.contract?.contractId} signed</p>
                      ) : contractGenerated ? (
                        <p className="text-xs text-muted-foreground/70">
                          Contract {finalization?.contract?.contractId} ready to sign
                        </p>
                      ) : paymentComplete ? (
                        <p className="text-xs text-amber-600/70">⏳ Remote Leverage is generating contract</p>
                      ) : (
                        <p className="text-xs text-muted-foreground/70">Complete payment first</p>
                      )}
                    </div>
                  </div>
                  {!contractComplete && contractGenerated && paymentComplete && (
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs h-6 px-2"
                      onClick={() => setShowContractModal(true)}
                    >
                      Sign Contract →
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                HANDLED BY REMOTE LEVERAGE
              </p>
              <p className="text-[10px] text-muted-foreground mb-2 italic">
                These update automatically — no action needed from you
              </p>
              <div className="space-y-2">
                {[
                  {
                    label: "Payroll Setup",
                    desc: "Setting up payroll with partner company",
                    complete: finalization?.payroll?.status === 'complete'
                  },
                  {
                    label: "Compliance Verification",
                    desc: "Verifying legal and tax requirements",
                    complete: finalization?.compliance?.status === 'verified'
                  },
                  {
                    label: "CSM Assignment",
                    desc: "Assigning Customer Success Manager",
                    complete: finalization?.csm?.status === 'assigned'
                  },
                  {
                    label: "Start Date Confirmation",
                    desc: `Confirming ${entry.offer?.startDate || "start date"} with ${talent.firstName}`,
                    complete: finalization?.startDate?.status === 'confirmed'
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {item.complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                      </div>
                    )}
                    <div>
                      <span className={`text-sm ${item.complete ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {item.label}
                      </span>
                      <p className="text-xs text-muted-foreground/70">
                        {item.complete ? '✓ Complete' : item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
    }

    if (stage === "hired") {
      if (isCurrent) {
        return (
          <div className="space-y-4">
            <div className="text-center py-1">
              <p className="text-base font-semibold text-foreground">🎉 Hire Complete!</p>
            </div>
            <div className="bg-muted rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-foreground">{talentName}</p>
              <p className="text-xs text-muted-foreground">{talent.headline}</p>
              <p className="text-xs text-muted-foreground">
                ${entry.offer?.rate || talent.hourlyRate}/hr • {entry.offer?.type || "Full-time"}
              </p>
              <p className="text-xs text-muted-foreground">
                Started: {entry.offer?.startDate ? formatDate(entry.offer.startDate) : "TBD"}
              </p>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                <Shield className="h-4 w-4 text-emerald-500" /> 6-Month Replacement Guarantee
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                If this hire isn't the right fit, we'll find a replacement at no additional cost.
              </p>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">🎟️ 30% Off Next Hire</p>
              <p className="text-xs text-muted-foreground mt-1">
                Valid for 12 months. Hire your next VA at a discounted placement fee.
              </p>
              <Button size="sm" variant="outline" className="text-xs h-7 mt-2" asChild>
                <Link to="/talent">Browse Talent Pool →</Link>
              </Button>
            </div>
          </div>
        );
      }
    }

    return null;
  };

  const mainAction = getMainAction();

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[440px] max-w-full bg-card shadow-2xl z-50 animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {talent.avatar ? (
              <img
                src={talent.avatar}
                alt={talentName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                {talentInitials}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground">{talentName}</h2>
              <p className="text-sm text-muted-foreground">{talent.headline}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-xs font-medium bg-emerald-500/10 text-emerald-700 rounded-full px-2 py-0.5">
              ${talent.hourlyRate}/hr
            </span>
            <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              🌎 {talent.region?.replace('_', ' ')}
            </span>
            <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {talent.englishProficiency} English
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5">
              For: {job.title}
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Stage Stepper */}
          <div className="space-y-0">
            {stageOrder.map((stage, i) => {
              const isCompleted = i < currentIdx;
              const isCurrent = stage === entry.stage;
              const isExpanded = expandedStage === stage && (isCurrent || isCompleted);

              return (
                <div key={stage} className="relative">
                  {i < stageOrder.length - 1 && (
                    <div
                      className={`absolute left-[11px] top-6 w-0.5 ${
                        isCompleted
                          ? "bg-emerald-400 h-full"
                          : isCurrent
                          ? "bg-gradient-to-b from-primary to-transparent h-full"
                          : "h-full border-l border-dashed border-muted-foreground/20"
                      }`}
                    />
                  )}

                  <div
                    className={`relative z-10 flex items-center gap-3 py-2 ${
                      (isCompleted || isCurrent) ? "cursor-pointer" : ""
                    }`}
                    onClick={() => {
                      if (isCompleted || isCurrent) {
                        setExpandedStage(expandedStage === stage ? null : stage);
                      }
                    }}
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

                    <span className={`text-sm font-medium ${
                      isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground/40"
                    }`}>
                      {stageConfig[stage].label}
                      {isCurrent && <span className="text-xs text-primary/60 ml-1">(Current)</span>}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className={`ml-9 pb-4 ${isCurrent ? "bg-primary/5 rounded-lg p-3 -ml-1 pl-10 mb-2" : ""}`}>
                      {renderStageContent(stage)}
                    </div>
                  )}

                  {isCompleted && !isExpanded && (
                    <div className="ml-9 pb-3">
                      {renderStageContent(stage)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notes Section */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-foreground mb-3">Notes</p>
            <div className="flex gap-2">
              <Textarea
                className="text-sm flex-1"
                placeholder="Type your note here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>
            <Button
              size="sm"
              className="mt-2 text-xs h-7"
              onClick={handleAddNote}
              disabled={!note.trim() || isAddingNote}
            >
              {isAddingNote && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Add Note
            </Button>

            {entry.notes && entry.notes.length > 0 && (
              <div className="space-y-2 mt-3">
                {entry.notes.map((n, idx) => (
                  <div key={idx} className="bg-muted rounded-lg p-2.5">
                    <p className="text-sm text-foreground">{n.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stage History */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-foreground mb-2">Stage History</p>
              <div className="space-y-1.5">
                {[...entry.stageHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${stageConfig[h.to]?.color || "bg-gray-500"}`} />
                    <span className="text-foreground">
                      {h.from ? `${stageConfig[h.from]?.label || h.from} → ` : ""}
                      {stageConfig[h.to]?.label || h.to}
                    </span>
                    <span className="text-muted-foreground ml-auto">{formatDate(h.changedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom action bar */}
        <div className="p-4 border-t border-border bg-card shrink-0 space-y-2">
          {mainAction && (
            <Button
              className="w-full"
              variant={mainAction.variant}
              onClick={mainAction.onClick}
              disabled={mainAction.disabled}
            >
              {mainAction.disabled && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mainAction.label}
            </Button>
          )}
          {entry.stage === "hired" && (
            <p className="text-center text-sm text-emerald-600 font-medium">Hire Complete ✅</p>
          )}
          <div className="flex items-center justify-between">
            <Link
              to={`/talent/${talent._id}`}
              className="text-xs text-primary hover:underline"
            >
              View Full Profile ↗
            </Link>
            {entry.stage !== "hired" && entry.stage !== "rejected" && (
              <button
                className="text-xs text-destructive/40 hover:text-destructive transition-colors"
                onClick={() => setShowRejectModal(true)}
              >
                Reject Candidate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          {!paymentSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Pay Placement Fee Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground">Invoice Number</p>
                      <p className="text-sm font-medium text-foreground">{entry.finalization?.payment?.invoiceId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Amount Due</p>
                      <p className="text-lg font-bold text-foreground">${entry.finalization?.payment?.amount || 2500}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">For hiring {talentName}</p>
                    <p className="text-xs text-muted-foreground">One-time placement fee</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Credit/Debit Card (Stripe)</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="ach">ACH Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2">
                  💳 Demo: This simulates a payment. In production, you'd be redirected to Stripe.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowPaymentModal(false)} disabled={isProcessingPayment}>
                    Cancel
                  </Button>
                  <Button onClick={handleProcessPayment} disabled={isProcessingPayment}>
                    {isProcessingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Pay ${entry.finalization?.payment?.amount || 2500} →
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-foreground">Payment Successful!</p>
              <div className="space-y-1 text-sm text-muted-foreground bg-muted rounded-lg p-3">
                <p>Amount Paid: <span className="font-medium text-foreground">${entry.finalization?.payment?.amount || 2500}</span></p>
                <p>Invoice: <span className="font-medium text-foreground">{entry.finalization?.payment?.invoiceId}</span></p>
                <p>Payment Method: <span className="font-medium text-foreground capitalize">{paymentMethod.replace('_', ' ')}</span></p>
              </div>
              <p className="text-xs text-muted-foreground">
                Remote Leverage will now generate your contract
              </p>
              <Button onClick={handlePaymentDone} className="w-full" disabled={isProcessingPayment}>
                {isProcessingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Done ✓
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contract Modal */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent className="sm:max-w-md">
          {!contractSigned ? (
            <>
              <DialogHeader>
                <DialogTitle>Sign Employment Contract</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-foreground">Contract Number</p>
                    <p className="font-mono text-xs text-muted-foreground">{entry.finalization?.contract?.contractId}</p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3 space-y-1.5 text-sm">
                  <p className="font-medium text-foreground">Parties:</p>
                  <p className="text-muted-foreground">• Contractor: {talentName}</p>
                  <p className="text-muted-foreground">• Client: Your Company</p>
                  <p className="text-muted-foreground">• Facilitated by: Remote Leverage</p>
                </div>
                <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-medium text-foreground">Terms:</p>
                  <p className="text-muted-foreground">
                    • Rate: ${entry.offer?.rate || talent.hourlyRate}/hr
                  </p>
                  <p className="text-muted-foreground">
                    • Hours: {entry.offer?.hoursPerWeek || 40} hrs/week ({entry.offer?.type || "Full-time"})
                  </p>
                  <p className="text-muted-foreground">
                    • Start Date: {entry.offer?.startDate ? formatDate(entry.offer.startDate) : "TBD"}
                  </p>
                  <p className="text-muted-foreground">• Guarantee: 6-month replacement</p>
                  <p className="text-muted-foreground">• 30% discount on next hire (12 months)</p>
                </div>
                <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2">
                  📝 Demo: This simulates e-signing. In production, this would use DocuSign.
                </p>
                <label className="flex items-start gap-2 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={contractAgreed}
                    onCheckedChange={(c) => setContractAgreed(!!c)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-foreground">
                    I have reviewed and agree to the terms of this employment contract
                  </span>
                </label>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowContractModal(false)} disabled={isSigningContract}>
                    Cancel
                  </Button>
                  <Button onClick={handleSignContractAction} disabled={!contractAgreed || isSigningContract}>
                    {isSigningContract && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Sign Contract →
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-foreground">Contract Signed Successfully!</p>
              <div className="space-y-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
                <p>✓ Your signature has been recorded</p>
                <p>✓ {talentName} will countersign</p>
                <p>✓ Contract #{entry.finalization?.contract?.contractId}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Remote Leverage will now complete payroll setup and compliance verification
              </p>
              <Button onClick={handleContractDone} className="w-full" disabled={isSigningContract}>
                {isSigningContract && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Done ✓
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Candidate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reject {talentName} for {job.title}?
            </p>
            <div>
              <Label className="text-sm">Reason</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea
                className="mt-1"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={isRejecting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectCandidate} disabled={isRejecting}>
                {isRejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reject Candidate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
