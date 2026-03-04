import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, MoreHorizontal, Briefcase } from "lucide-react";
import { jobService } from "@/services/job.service";
import { ROLE_CATEGORY_OPTIONS, AVAILABILITY_OPTIONS, getRoleCategoryLabel } from "@/utils/constants";
import type { Job } from "@/types/api";
import { formatDateShort } from "@/utils/dateFormatters";

const statusStyles: Record<string, string> = {
  open: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  closed: "bg-secondary text-muted-foreground",
};

const Jobs = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [roleCategory, setRoleCategory] = useState("");
  const [customRoleName, setCustomRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [hourlyRateMin, setHourlyRateMin] = useState("");
  const [hourlyRateMax, setHourlyRateMax] = useState("");
  const [availability, setAvailability] = useState("");

  // Fetch jobs
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobService.list(),
  });

  // Create job mutation
  const createMutation = useMutation({
    mutationFn: jobService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Role created successfully');
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create role');
    },
  });

  // Delete job mutation
  const deleteMutation = useMutation({
    mutationFn: jobService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Role deleted');
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error('Cannot delete — this job has candidates in the pipeline');
      } else {
        toast.error('Failed to delete job');
      }
    },
  });

  const resetForm = () => {
    setTitle("");
    setRoleCategory("");
    setCustomRoleName("");
    setDescription("");
    setRequirements("");
    setHourlyRateMin("");
    setHourlyRateMax("");
    setAvailability("");
  };

  const handleCreate = () => {
    if (!title || !roleCategory || !description || !hourlyRateMin || !hourlyRateMax || !availability) {
      toast.error('Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      title,
      roleCategory,
      customRoleName: roleCategory === 'custom' ? customRoleName : undefined,
      description,
      requirements: requirements || undefined,
      hourlyRateMin: parseInt(hourlyRateMin),
      hourlyRateMax: parseInt(hourlyRateMax),
      availability,
    });
  };

  return (
    <div className="px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Your Open Roles</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create New Role</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Role Title</Label>
                <Input
                  placeholder="e.g., Administrative Assistant"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={roleCategory} onValueChange={setRoleCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {ROLE_CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {roleCategory === "custom" && (
                <div className="space-y-2">
                  <Label>Custom Role Name</Label>
                  <Input
                    placeholder="e.g., Podcast Editor, Data Analyst..."
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the role and responsibilities..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Rate ($/hr)</Label>
                  <Input
                    type="number"
                    placeholder="7"
                    value={hourlyRateMin}
                    onChange={(e) => setHourlyRateMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Rate ($/hr)</Label>
                  <Input
                    type="number"
                    placeholder="12"
                    value={hourlyRateMax}
                    onChange={(e) => setHourlyRateMax(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Role'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3 mt-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Briefcase className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-semibold text-foreground">No roles posted yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create your first role to start building your hiring pipeline.
          </p>
        </div>
      )}

      {/* Jobs list */}
      {!isLoading && jobs.length > 0 && (
        <div className="space-y-3 mt-6">
          {jobs.map((job) => (
            <div key={job._id} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{job.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
                    {getRoleCategoryLabel(job.roleCategory)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Posted {formatDateShort(job.createdAt)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ${job.hourlyRateMin}-${job.hourlyRateMax}/hr
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> {job.candidateCount || 0} candidates
                </span>
                <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 capitalize ${statusStyles[job.status]}`}>
                  {job.status}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${job.title}"?`)) {
                      deleteMutation.mutate(job._id);
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={deleteMutation.isPending}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
