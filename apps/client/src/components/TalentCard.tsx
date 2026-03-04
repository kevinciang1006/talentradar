import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Talent } from "@/types/api";
import { BookmarkPlus, Globe, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { jobService } from "@/services/job.service";
import { pipelineService } from "@/services/pipeline.service";
import { REGION_FLAGS, getRegionLabel } from "@/utils/constants";

const TalentCard = ({ talent }: { talent: Talent }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"confirm" | "select" | "no-jobs">("confirm");
  const [selectedJobId, setSelectedJobId] = useState("");

  // Fetch jobs for shortlist dialog
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobService.list,
    enabled: showDialog,
  });

  // Add to pipeline mutation
  const addToPipelineMutation = useMutation({
    mutationFn: ({ jobId, talentId }: { jobId: string; talentId: string }) =>
      pipelineService.addToPipeline(jobId, talentId),
    onSuccess: (_, variables) => {
      const job = jobs.find(j => j._id === variables.jobId);
      const talentName = `${talent.firstName} ${talent.lastName}`;
      toast.success(`${talentName} added to ${job?.title || 'pipeline'} ✓`);
      queryClient.invalidateQueries({ queryKey: ['talents'] });
      setShowDialog(false);
      setSelectedJobId("");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to add to pipeline';
      toast.error(message);
    },
  });

  const maxSkills = 3;
  const skillNames = talent.skills.map(s => s.name);
  const visibleSkills = skillNames.slice(0, maxSkills);
  const moreCount = skillNames.length - maxSkills;

  const isInPipeline = talent.isInPipeline || false;

  const regionFlag = REGION_FLAGS[talent.region] || '🌍';
  const initials = `${talent.firstName[0]}${talent.lastName[0]}`.toUpperCase();
  const fullName = `${talent.firstName} ${talent.lastName}`;

  const handleShortlist = () => {
    if (isInPipeline) return;
    if (jobs.length === 0) {
      setDialogMode("no-jobs");
      setShowDialog(true);
      return;
    }
    if (jobs.length === 1) {
      setDialogMode("confirm");
      setSelectedJobId(jobs[0]._id);
      setShowDialog(true);
      return;
    }
    setDialogMode("select");
    setSelectedJobId("");
    setShowDialog(true);
  };

  const confirmShortlist = () => {
    const jobId = dialogMode === "confirm" ? jobs[0]?._id : selectedJobId;
    if (jobId) {
      addToPipelineMutation.mutate({ jobId, talentId: talent._id });
    }
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all duration-200">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{talent.headline}</p>
            </div>
          </div>
          <span className="shrink-0 bg-success/10 text-success rounded-full text-xs font-semibold px-2.5 py-1">
            ${talent.hourlyRate}/hr
          </span>
        </div>

        {/* Region */}
        <p className="text-xs text-muted-foreground mt-3">
          {regionFlag} {getRegionLabel(talent.region).replace(/^🌎 |^🇵🇭 |^🇿🇦 |^🇪🇬 /, '')} • {talent.city}, {talent.country}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {visibleSkills.map((s) => (
            <span key={s} className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
              {s}
            </span>
          ))}
          {moreCount > 0 && (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
              +{moreCount} more
            </span>
          )}
        </div>

        {/* Bottom info */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" /> {talent.englishProficiency} English
            </span>
            <span>{talent.yearsOfExperience} yrs exp</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
              {talent.availability === 'full_time' ? 'Full-time' : 'Part-time'}
            </span>
            {talent.isImmediatelyAvailable && (
              <span className="flex items-center gap-1 text-xs text-success">
                <span className="w-2 h-2 bg-success rounded-full" /> Available
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1 text-sm" asChild>
            <Link to={`/talent/${talent._id}`}>View Profile</Link>
          </Button>
          {isInPipeline ? (
            <Button
              variant="ghost"
              size="sm"
              className="bg-emerald-50 text-emerald-600 cursor-not-allowed hover:bg-emerald-50"
              disabled
            >
              <Check className="h-4 w-4 mr-1" /> In Pipeline
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/5"
              onClick={handleShortlist}
              disabled={addToPipelineMutation.isPending}
            >
              {addToPipelineMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4 mr-1" /> Shortlist
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Shortlist Dialogs */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-sm">
          {dialogMode === "confirm" && (
            <>
              <DialogHeader><DialogTitle>Add to Pipeline?</DialogTitle></DialogHeader>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Add <span className="font-medium text-foreground">{fullName}</span> to:
                </p>
                <p className="text-sm font-medium text-foreground mt-1">"{jobs[0]?.title}"</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)} disabled={addToPipelineMutation.isPending}>
                  Cancel
                </Button>
                <Button onClick={confirmShortlist} disabled={addToPipelineMutation.isPending}>
                  {addToPipelineMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add to Pipeline ✓'
                  )}
                </Button>
              </div>
            </>
          )}

          {dialogMode === "select" && (
            <>
              <DialogHeader><DialogTitle>Add to Pipeline</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground mt-1">
                Select a role for <span className="font-medium text-foreground">{fullName}</span>:
              </p>
              <div className="space-y-2 mt-3">
                {jobs.map((job) => (
                  <label key={job._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <input
                      type="radio"
                      name="job"
                      value={job._id}
                      checked={selectedJobId === job._id}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">{job.title}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)} disabled={addToPipelineMutation.isPending}>
                  Cancel
                </Button>
                <Button onClick={confirmShortlist} disabled={!selectedJobId || addToPipelineMutation.isPending}>
                  {addToPipelineMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add to Pipeline ✓'
                  )}
                </Button>
              </div>
            </>
          )}

          {dialogMode === "no-jobs" && (
            <>
              <DialogHeader><DialogTitle>Create a Role First</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground mt-2">
                You need at least one open role to add candidates to a pipeline.
              </p>
              <div className="flex justify-end mt-4">
                <Button onClick={() => { setShowDialog(false); navigate("/jobs"); }}>Create New Role →</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TalentCard;
