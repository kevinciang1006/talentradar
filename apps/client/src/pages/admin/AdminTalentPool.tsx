import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { getRegionName, getEnglishLevel, getInitials } from "@/utils/talentHelpers";

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-700" },
  in_pipeline: { label: "In Pipeline", color: "bg-primary/10 text-primary" },
  hired: { label: "Hired", color: "bg-[hsl(270,60%,50%)]/10 text-[hsl(270,60%,50%)]" },
  inactive: { label: "Inactive", color: "bg-muted text-muted-foreground" },
};

const AdminTalentPool = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch talents from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-talents', { search: debouncedSearch, region: regionFilter, status: statusFilter }],
    queryFn: () => adminService.getTalent({
      search: debouncedSearch || undefined,
      regions: regionFilter !== "all" ? regionFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
  });

  const talents = data?.talents || [];
  const totalCount = data?.meta?.total || 0;

  return (
    <div className="px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Talent Pool</h1>
          <p className="text-sm text-muted-foreground mt-1">{totalCount} candidates</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mt-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="philippines">Philippines</SelectItem>
            <SelectItem value="latin_america">Latin America</SelectItem>
            <SelectItem value="south_africa">South Africa</SelectItem>
            <SelectItem value="egypt">Egypt</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="in_pipeline">In Pipeline</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {isLoading ? (
          // Loading skeleton cards
          [1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : error ? (
          // Error state
          <div className="col-span-full text-center py-20">
            <p className="text-lg font-semibold text-foreground">Failed to load talent pool</p>
            <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
          </div>
        ) : talents.length === 0 ? (
          // Empty state
          <div className="col-span-full text-center py-20">
            <p className="text-lg font-semibold text-foreground">No candidates found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          // Talent cards
          talents.map((talent) => {
            const fullName = `${talent.firstName} ${talent.lastName}`;
            const initials = getInitials(talent.firstName, talent.lastName);
            const regionName = getRegionName(talent.region);
            const englishLevel = getEnglishLevel(talent.englishProficiency);
            const status = (talent as any).status || "active";
            const statusInfo = statusMap[status];
            const pipelineCount = (talent as any).pipelineCount || 0;

            return (
              <div key={talent._id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground truncate">{fullName}</h3>
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{talent.headline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-emerald-600">${talent.hourlyRate}/hr</span>
                      <span className="text-xs text-muted-foreground">• {regionName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">English: {englishLevel}</span>
                      {pipelineCount > 0 && (
                        <span className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">
                          Pipeline: {pipelineCount} {pipelineCount === 1 ? "company" : "companies"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminTalentPool;
