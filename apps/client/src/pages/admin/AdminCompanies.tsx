import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight, X } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { formatDateShort } from "@/utils/dateFormatters";
import type { AdminCompany, AdminCompanyDetail } from "@/types/api";

const AdminCompanies = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Fetch companies list
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: () => adminService.getCompanies(),
  });

  // Fetch selected company details
  const { data: selectedCompanyData } = useQuery({
    queryKey: ['admin-company', selectedCompanyId],
    queryFn: () => adminService.getCompanyById(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const companiesList = companies || [];

  // Helper functions for slide-over
  const getJobPipelineStats = (jobId: string, pipelineActivity: AdminCompanyDetail['pipelineActivity']) => {
    const jobEntries = pipelineActivity.filter(
      (entry) => entry.jobId._id === jobId && entry.stage !== 'hired' && entry.stage !== 'rejected'
    );
    const hiredCount = pipelineActivity.filter(
      (entry) => entry.jobId._id === jobId && entry.stage === 'hired'
    ).length;

    return {
      pipelineCount: jobEntries.length,
      hiredCount,
    };
  };

  const getRecentActivity = (pipelineActivity: AdminCompanyDetail['pipelineActivity']) => {
    const activities: Array<{ date: string; event: string }> = [];

    pipelineActivity.forEach((entry) => {
      const latestChange = entry.stageHistory[entry.stageHistory.length - 1];
      if (latestChange) {
        const talentName = `${entry.talentId.firstName} ${entry.talentId.lastName}`;
        const jobTitle = entry.jobId.title;

        let event = '';
        if (latestChange.to === 'hired') {
          event = `Hired ${talentName} — ${jobTitle}`;
        } else if (latestChange.to === 'offer') {
          event = `Submitted offer to ${talentName} — ${jobTitle}`;
        } else if (latestChange.to === 'interview') {
          event = `Scheduled interview with ${talentName}`;
        } else if (latestChange.to === 'screening') {
          event = `Sent screening task to ${talentName}`;
        } else if (latestChange.to === 'shortlisted') {
          event = `Shortlisted ${talentName} for ${jobTitle}`;
        }

        if (event) {
          activities.push({
            date: formatDateShort(latestChange.changedAt),
            event,
          });
        }
      }
    });

    // Sort by most recent first and take top 10
    return activities.slice(0, 10);
  };

  const getGuaranteeEndDate = (startDate: string) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 6);
    return formatDateShort(end);
  };

  // Client-side filtering
  const filtered = companiesList.filter((c) => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    // Status filter based on hireCount
    const status = c.hireCount > 0 ? "has-hires" : "active";
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">{companies?.length || 0} companies</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="has-hires">Has Hires</SelectItem>
            <SelectItem value="new">New</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-20">
          <p className="text-lg font-semibold text-foreground">Failed to load companies</p>
          <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
        </div>
      )}

      {/* Companies grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {filtered.map((company) => {
            const status = company.hireCount > 0 ? "has-hires" : "active";

            return (
              <div key={company._id} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelectedCompanyId(company._id)}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">{company.name}</h3>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                    status === "has-hires" ? "bg-emerald-500/10 text-emerald-700" :
                    "bg-muted text-muted-foreground"
                  }`}>{status === "has-hires" ? "Has Hires" : "Active"}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{company.email} • {company.size} employees</p>
                <p className="text-xs text-muted-foreground mt-0.5">Revenue: {company.monthlyRevenue}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>📊 {company.jobCount} open roles</span>
                  <span>• {company.pipelineCount} in pipeline</span>
                  <span>• {company.hireCount} hires</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Joined: {formatDateShort(company.createdAt)}</p>
                <div className="flex items-center justify-end mt-2">
                  <span className="text-xs text-primary flex items-center gap-0.5">View Details <ChevronRight className="h-3 w-3" /></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-lg font-semibold text-foreground">No companies found</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
        </div>
      )}

      {/* Company Detail Slide-Over */}
      {selectedCompanyData && (
        <>
          <div className="fixed inset-0 bg-foreground/20 z-50" onClick={() => setSelectedCompanyId(null)} />
          <div className="fixed right-0 top-0 h-full w-[480px] max-w-full bg-card shadow-2xl z-50 animate-slide-in-right flex flex-col">
            <div className="p-5 border-b border-border shrink-0">
              <button onClick={() => setSelectedCompanyId(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">{selectedCompanyData.company.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedCompanyData.company.email} • {selectedCompanyData.company.size} employees • {selectedCompanyData.company.monthlyRevenue}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Joined {formatDateShort(selectedCompanyData.company.createdAt)}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Open Roles */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Open Roles</p>
                <div className="space-y-2">
                  {selectedCompanyData.jobs.map((job) => {
                    const stats = getJobPipelineStats(job._id, selectedCompanyData.pipelineActivity);

                    return (
                      <div key={job._id} className="flex items-center justify-between bg-muted rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {stats.pipelineCount} in pipeline
                            {stats.hiredCount > 0 ? `, ${stats.hiredCount} hired` : ""}
                          </p>
                        </div>
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                          job.status === "open" ? "bg-emerald-500/10 text-emerald-700" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {selectedCompanyData.jobs.length === 0 && (
                  <p className="text-sm text-muted-foreground">No open roles</p>
                )}
              </div>

              {/* Hiring Activity */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Hiring Activity</p>
                <div className="space-y-1.5">
                  {getRecentActivity(selectedCompanyData.pipelineActivity).map((activity, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground">{activity.event}</span>
                      <span className="text-muted-foreground ml-auto">{activity.date}</span>
                    </div>
                  ))}
                </div>
                {selectedCompanyData.pipelineActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>

              {/* Hires */}
              {selectedCompanyData.hires.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Hires ({selectedCompanyData.hires.length})
                  </p>
                  <div className="space-y-2">
                    {selectedCompanyData.hires.map((hire) => {
                      const talentName = `${hire.talentId.firstName} ${hire.talentId.lastName}`;
                      const startDate = hire.finalization?.startDate?.confirmedDate || hire.offer.startDate;

                      return (
                        <div key={hire._id} className="bg-muted rounded-lg p-3">
                          <p className="text-sm font-medium text-foreground">
                            {talentName} — {hire.jobId.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${hire.offer.rate}/hr • Started {formatDateShort(startDate)}
                          </p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            🛡️ Guarantee active until {getGuaranteeEndDate(startDate)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCompanies;
