import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { talentService } from "@/services/talent.service";
import { jobService } from "@/services/job.service";
import { pipelineService } from "@/services/pipeline.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Clock, Briefcase, DollarSign, Globe, MessageSquare, Calendar, BookmarkPlus, Download, GraduationCap, Shield, CheckCircle2, Volume2, Loader2, Check, ArrowLeft } from "lucide-react";
import {
  getRegionFlag,
  getRegionName,
  getEnglishLevel,
  getAvailabilityLabel,
  getInitials,
  formatExperiencePeriod,
  groupSkillsByProficiency
} from "@/utils/talentHelpers";
import { formatDateLong } from "@/utils/dateFormatters";

const TalentProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"confirm" | "select" | "no-jobs">("confirm");
  const [selectedJobId, setSelectedJobId] = useState("");

  // Fetch talent data from API
  const { data: talent, isLoading, error } = useQuery({
    queryKey: ['talent', id],
    queryFn: () => talentService.getById(id!),
    enabled: !!id,
  });

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
      queryClient.invalidateQueries({ queryKey: ['talent', id] });
      setShowDialog(false);
      setSelectedJobId("");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to add to pipeline';
      toast.error(message);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !talent) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-lg font-semibold text-foreground">Candidate not found</p>
        <Button asChild className="mt-4"><Link to="/talent">Back to Talent Pool</Link></Button>
      </div>
    );
  }

  // Compute derived values
  const fullName = `${talent.firstName} ${talent.lastName}`;
  const initials = getInitials(talent.firstName, talent.lastName);
  const regionFlag = getRegionFlag(talent.region);
  const regionName = getRegionName(talent.region);
  const englishLevel = getEnglishLevel(talent.englishProficiency);
  const availabilityLabel = getAvailabilityLabel(talent.availability);
  const { expert, advanced, intermediate } = groupSkillsByProficiency(talent.skills);
  const isInPipeline = talent.isInPipeline || false;

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
    <div className="px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back button + Breadcrumb */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <nav className="text-sm text-muted-foreground">
          <Link to="/talent" className="text-primary hover:underline">Talent Pool</Link>
          <span className="mx-2">›</span>
          <span>{fullName}</span>
        </nav>
      </div>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
            <p className="text-muted-foreground mt-1">{talent.headline} | {talent.skills[0]?.name} Expert</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {talent.city}, {talent.country}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {talent.timezone}</span>
              <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {talent.yearsOfExperience} years experience</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs">{regionFlag} {regionName}</span>
              <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs">{englishLevel} English</span>
              <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs">{availabilityLabel}</span>
              {talent.isImmediatelyAvailable && (
                <span className="bg-success/10 text-success rounded-full px-2.5 py-0.5 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-success rounded-full" /> Available Now
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            <span className="text-3xl font-bold text-success">${talent.hourlyRate} / hr</span>
            {isInPipeline ? (
              <Button
                className="gap-2 bg-emerald-50 text-emerald-600 cursor-not-allowed hover:bg-emerald-50"
                disabled
              >
                <Check className="h-4 w-4" /> In Pipeline
              </Button>
            ) : (
              <Button
                className="gap-2"
                onClick={handleShortlist}
                disabled={addToPipelineMutation.isPending}
              >
                {addToPipelineMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" /> Add to Shortlist
                  </>
                )}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hidden"><Download className="h-4 w-4" /> Download Profile</Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {talent.bio}
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Skills & Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {expert.map((s) => <span key={s.name} className="border border-primary/20 bg-primary/5 text-primary rounded-full px-3 py-1 text-xs font-medium">{s.name}</span>)}
              {advanced.map((s) => <span key={s.name} className="border border-success/20 bg-success/5 text-success rounded-full px-3 py-1 text-xs font-medium">{s.name}</span>)}
              {intermediate.map((s) => <span key={s.name} className="border border-warning/20 bg-warning/5 text-warning rounded-full px-3 py-1 text-xs font-medium">{s.name}</span>)}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Expert</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Advanced</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Intermediate</span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Work Experience</h2>
            <div className="space-y-6 relative">
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
              {talent.experience.map((exp, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="w-3 h-3 rounded-full bg-primary border-2 border-card shrink-0 mt-1 z-10" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{exp.title}</p>
                    <p className="text-xs text-muted-foreground">{exp.company} • {formatExperiencePeriod(exp.startDate, exp.endDate)}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Education</h2>
            <div className="space-y-3">
              {talent.education.map((edu, i) => (
                <div key={i} className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{edu.degree}</p>
                    <p className="text-xs text-muted-foreground">{edu.institution}, {edu.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Languages</h2>
            <div className="flex flex-wrap gap-6">
              {talent.languages.map((lang, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{lang.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    lang.proficiency === 'native' ? 'bg-success/10 text-success' :
                    lang.proficiency === 'fluent' ? 'bg-primary/10 text-primary' :
                    'bg-secondary text-secondary-foreground'
                  }`}>
                    {lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vetting Report */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-2 bg-success/10">
                  <Shield className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm font-semibold text-foreground">Vetting Report</span>
              </div>
              <span className="bg-success/10 text-success rounded-full px-2 py-0.5 text-xs font-medium">Verified ✓</span>
            </div>

            <div className="space-y-4 mt-4">
              {/* English Assessment */}
              <div>
                <p className="text-xs text-muted-foreground">English Proficiency</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-foreground">
                    {talent.vettingReport.englishScore.toFixed(1)} / 5.0
                  </span>
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                    {englishLevel}
                  </span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i <= Math.round(talent.vettingReport.englishScore) ? "bg-primary" : "bg-secondary"}`} />
                  ))}
                </div>
                <button className="flex items-center gap-1 text-xs text-primary hover:underline mt-1.5">
                  <Volume2 className="h-3 w-3" /> Listen to Voice Sample
                </button>
              </div>

              {/* Verification Checklist */}
              <div className="space-y-2">
                {[
                  { check: talent.vettingReport.skillsAssessmentPassed, label: "Skills Assessment Passed" },
                  { check: talent.vettingReport.backgroundVerified, label: "Background Verified" },
                  { check: talent.vettingReport.remoteWorkHistoryConfirmed, label: "Remote Work History Confirmed" },
                  { check: talent.vettingReport.referenceChecked, label: "Reference Checked" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.check ? 'text-success' : 'text-muted-foreground'}`} />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* RL Rating */}
              <div>
                <p className="text-xs text-muted-foreground">Remote Leverage Rating</p>
                <span className="inline-block mt-1 bg-warning/10 text-warning rounded-lg px-2 py-1 text-xs font-medium">
                  ⭐ {talent.vettingReport.rlRating}
                </span>
              </div>

              {/* Vetted Date */}
              <p className="text-xs text-muted-foreground">
                Vetted {formatDateLong(talent.vettingReport.vettedDate)}
              </p>
            </div>
          </div>

          {/* Quick Facts */}
          <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Facts</h2>
            <div className="space-y-4">
              {[
                { icon: DollarSign, label: "Hourly Rate", value: `$${talent.hourlyRate} / hr` },
                { icon: Clock, label: "Availability", value: `${availabilityLabel} (${talent.weeklyHours} hrs/week)` },
                { icon: Globe, label: "Timezone", value: `${talent.timezone} (${talent.country})` },
                { icon: MessageSquare, label: "English", value: englishLevel },
                { icon: Briefcase, label: "Experience", value: `${talent.yearsOfExperience} years` },
                { icon: Calendar, label: "Available to Start", value: talent.isImmediatelyAvailable ? "Immediately" : "2 weeks notice" },
              ].map((f) => (
                <div key={f.label} className="flex items-start gap-3">
                  <f.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className={`text-sm font-medium ${f.label === "Available to Start" && talent.isImmediatelyAvailable ? "text-success" : "text-foreground"}`}>{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Tools & Software</h2>
            <div className="flex flex-wrap gap-2">
              {talent.tools.map((tool) => (
                <span key={tool} className="bg-secondary rounded-lg px-3 py-1.5 text-sm text-secondary-foreground">{tool}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shortlist Dialog */}
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
    </div>
  );
};

export default TalentProfilePage;
