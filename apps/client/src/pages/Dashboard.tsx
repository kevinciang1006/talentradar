import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Users, GitPullRequest, Calendar, CheckCircle2, Search, LayoutDashboard, Plus, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService } from "@/services/dashboard.service";
import { jobService } from "@/services/job.service";
import { formatDistanceToNow } from "date-fns";
import { formatActivityMessage, formatRelativeTime, getActivityDotColor } from "@/utils/formatActivity";

const Dashboard = () => {
  const { company } = useAuth();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: dashboardService.getRecentActivity,
  });

  const { data: interviews = [], isLoading: interviewsLoading } = useQuery({
    queryKey: ['dashboard-interviews'],
    queryFn: dashboardService.getUpcomingInterviews,
  });

  const { data: activeOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['dashboard-active-offers'],
    queryFn: dashboardService.getActiveOffers,
  });

  const { data: allJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobService.list,
  });

  // Filter jobs by status
  const openRoles = allJobs.filter(job => job.status === 'open');

  const statCards = stats ? [
    {
      icon: Users,
      iconBg: "bg-primary/10 text-primary",
      label: "Total Shortlisted",
      value: stats.totalShortlisted.toString(),
      subtitle: "across all roles"
    },
    {
      icon: GitPullRequest,
      iconBg: "bg-[hsl(270,60%,50%)]/10 text-[hsl(270,60%,50%)]",
      label: "In Pipeline",
      value: stats.inPipeline.toString(),
      subtitle: "active candidates"
    },
    {
      icon: Calendar,
      iconBg: "bg-warning/10 text-warning",
      label: "Interviews",
      value: stats.interviews.toString(),
      subtitle: "scheduled"
    },
    {
      icon: CheckCircle2,
      iconBg: "bg-success/10 text-success",
      label: "Hires Completed",
      value: stats.totalHired.toString(),
      subtitle: stats.finalizing > 0 ? `${stats.finalizing} finalizing` : "completed"
    },
  ] : [];

  return (
    <div className="px-6 lg:px-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {company?.name || 'there'} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your hiring pipeline.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5">
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))
        ) : (
          statCards.map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${s.iconBg}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground mt-3">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.subtitle}</p>
            </div>
          ))
        )}
      </div>

      {/* Active Offers Banner */}
      {!offersLoading && activeOffers.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-warning">
              {activeOffers.length} active {activeOffers.length === 1 ? 'offer' : 'offers'} awaiting response
            </span>
          </div>
          <Link to="/pipeline" className="text-sm text-warning hover:underline font-medium">View Pipeline →</Link>
        </div>
      )}

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Activity */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            <Link to="/pipeline" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {activitiesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <Skeleton className="w-2 h-2 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-0">
              {activities.map((a: any, i) => {
                // Format activity message
                const message = a.talentName && a.jobTitle && a.to
                  ? formatActivityMessage({
                      talentName: a.talentName,
                      jobTitle: a.jobTitle,
                      from: a.from,
                      to: a.to,
                      changedBy: a.changedBy || 'company',
                    })
                  : a.description || 'Activity updated';

                // Get stage for color
                const stage = a.to || a.stage;
                const dotColor = getActivityDotColor(stage);

                // Format timestamp
                const timeAgo = a.changedAt
                  ? formatRelativeTime(a.changedAt)
                  : a.timestamp
                  ? formatRelativeTime(a.timestamp)
                  : 'Recently';

                return (
                  <div key={i} className={`flex items-start gap-3 py-3 ${i < activities.length - 1 ? "border-b border-border" : ""}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming Interviews */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">Upcoming Interviews</h2>
              {!interviewsLoading && interviews.length > 0 && (
                <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                  {interviews.length}
                </span>
              )}
            </div>
            {interviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : interviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming interviews</p>
            ) : (
              <div className="space-y-3">
                {interviews.map((interview) => {
                  // Safe date formatting
                  const formatInterviewDate = (dateStr: string) => {
                    try {
                      const date = new Date(dateStr);
                      if (isNaN(date.getTime())) return 'TBD';
                      return date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      });
                    } catch {
                      return 'TBD';
                    }
                  };

                  const getTimeUntil = (dateStr: string) => {
                    try {
                      const date = new Date(dateStr);
                      if (isNaN(date.getTime())) return 'Soon';
                      return formatDistanceToNow(date);
                    } catch {
                      return 'Soon';
                    }
                  };

                  // Build talent name from firstName and lastName
                  const talentName = interview.talentId
                    ? `${interview.talentId.firstName} ${interview.talentId.lastName}`
                    : 'Unknown';
                  const jobTitle = interview.jobId?.title || 'Unknown Position';

                  return (
                    <div key={interview._id || interview.entryId} className="bg-muted rounded-lg p-3">
                      <p className="text-sm font-semibold text-foreground">{talentName}</p>
                      <p className="text-xs text-muted-foreground">{jobTitle}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          📅 {formatInterviewDate(interview.interview.scheduledAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <a
                          href={interview.interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Join Meeting
                        </a>
                        <span className="text-xs text-muted-foreground">
                          {getTimeUntil(interview.interview.scheduledAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/talent"><Search className="h-4 w-4" /> Browse Talent Pool</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/pipeline"><LayoutDashboard className="h-4 w-4" /> View Pipeline</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/jobs"><Plus className="h-4 w-4" /> Post New Role</Link>
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Open Roles</h3>
              {jobsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                </div>
              ) : openRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open roles</p>
              ) : (
                <div className="space-y-2">
                  {openRoles.slice(0, 5).map((r) => (
                    <div key={r._id} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{r.title}</span>
                      <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-success/10 text-success">
                        Open
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
