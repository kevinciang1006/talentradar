import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePostHog } from "@posthog/react";
import TalentCard from "@/components/TalentCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { talentService, type TalentSearchParams } from "@/services/talent.service";
import {
  ROLE_CATEGORY_OPTIONS,
  REGION_OPTIONS,
  ENGLISH_LEVEL_OPTIONS,
  AVAILABILITY_OPTIONS,
  SORT_OPTIONS
} from "@/utils/constants";

const FilterSection = ({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border pb-4 mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-semibold text-foreground mb-2">
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && children}
    </div>
  );
};

const FilterSidebar = ({
  selectedRoles, setSelectedRoles,
  selectedRegions, setSelectedRegions,
  selectedEnglish, setSelectedEnglish,
  selectedAvailability, setSelectedAvailability,
  onClear
}: any) => {
  const [showAllRoles, setShowAllRoles] = useState(false);
  const displayedRoles = showAllRoles ? ROLE_CATEGORY_OPTIONS : ROLE_CATEGORY_OPTIONS.slice(0, 6);

  const activeCount = selectedRoles.length + selectedRegions.length + selectedEnglish.length + selectedAvailability.length;

  return (
    <div className="py-6 px-5 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          {activeCount > 0 && (
            <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-sm text-primary hover:underline">Clear all</button>
        )}
      </div>

      <FilterSection title="Role">
        <div className="space-y-2">
          {displayedRoles.map((r) => (
            <label key={r.value} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <Checkbox
                checked={selectedRoles.includes(r.value)}
                onCheckedChange={(checked) =>
                  setSelectedRoles(checked ? [...selectedRoles, r.value] : selectedRoles.filter((x: string) => x !== r.value))
                }
              />
              {r.label}
            </label>
          ))}
          {!showAllRoles && ROLE_CATEGORY_OPTIONS.length > 6 && (
            <button onClick={() => setShowAllRoles(true)} className="text-sm text-primary hover:underline">Show more</button>
          )}
        </div>
      </FilterSection>

      <FilterSection title="Region">
        <div className="space-y-2">
          {REGION_OPTIONS.map((r) => (
            <label key={r.value} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <Checkbox
                checked={selectedRegions.includes(r.value)}
                onCheckedChange={(checked) =>
                  setSelectedRegions(checked ? [...selectedRegions, r.value] : selectedRegions.filter((x: string) => x !== r.value))
                }
              />
              {r.label}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="English Level">
        <div className="space-y-2">
          {ENGLISH_LEVEL_OPTIONS.map((l) => (
            <label key={l.value} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <Checkbox
                checked={selectedEnglish.includes(l.value)}
                onCheckedChange={(checked) =>
                  setSelectedEnglish(checked ? [...selectedEnglish, l.value] : selectedEnglish.filter((x: string) => x !== l.value))
                }
              />
              {l.label}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <div className="space-y-2">
          {AVAILABILITY_OPTIONS.map((a) => (
            <label key={a.value} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <Checkbox
                checked={selectedAvailability.includes(a.value)}
                onCheckedChange={(checked) =>
                  setSelectedAvailability(checked ? [...selectedAvailability, a.value] : selectedAvailability.filter((x: string) => x !== a.value))
                }
              />
              {a.label}
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

const TalentSearch = () => {
  const posthog = usePostHog();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(1);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedEnglish, setSelectedEnglish] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset to page 1 on search change

      // Track search event
      if (query) {
        posthog.capture('talent_search_performed', {
          query,
          query_length: query.length
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, posthog]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);

    // Track filter/sort changes
    const filterCount = selectedRoles.length + selectedRegions.length + selectedEnglish.length + selectedAvailability.length;
    if (filterCount > 0) {
      posthog.capture('talent_filters_applied', {
        role_filters: selectedRoles.length,
        region_filters: selectedRegions.length,
        english_filters: selectedEnglish.length,
        availability_filters: selectedAvailability.length,
        total_filters: filterCount,
        sort_by: sortBy
      });
    }
  }, [selectedRoles, selectedRegions, selectedEnglish, selectedAvailability, sortBy, posthog]);

  const clearFilters = () => {
    posthog.capture('talent_filters_cleared');
    setSelectedRoles([]);
    setSelectedRegions([]);
    setSelectedEnglish([]);
    setSelectedAvailability([]);
    setPage(1);
  };

  // Build search params
  const filters: TalentSearchParams = {
    page,
    limit: 20,
    sort: sortBy === "relevance" ? undefined : sortBy,
  };

  if (debouncedQuery) filters.search = debouncedQuery;
  if (selectedRoles.length > 0) filters.roleCategories = selectedRoles.join(',');
  if (selectedRegions.length > 0) filters.regions = selectedRegions.join(',');
  if (selectedEnglish.length > 0) filters.englishProficiency = selectedEnglish.join(',');
  // Only send availability when exactly one is selected
  if (selectedAvailability.length === 1) filters.availability = selectedAvailability[0];

  // Fetch talents from API
  const { data, isLoading } = useQuery({
    queryKey: ['talents', filters],
    queryFn: () => talentService.search(filters),
  });

  const talents = data?.talents || [];
  const meta = data?.meta;

  // Calculate showing count
  const showingStart = meta ? (meta.page - 1) * meta.limit + 1 : 0;
  const showingEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  const activeCount = selectedRoles.length + selectedRegions.length + selectedEnglish.length + selectedAvailability.length;
  const filterProps = {
    selectedRoles, setSelectedRoles,
    selectedRegions, setSelectedRegions,
    selectedEnglish, setSelectedEnglish,
    selectedAvailability, setSelectedAvailability,
    onClear: clearFilters
  };

  return (
    <div className="flex h-[calc(100vh-64px-24px)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 bg-card border-r border-border overflow-y-auto">
        <FilterSidebar {...filterProps} />
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border py-3 px-6 z-40 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, skills, or role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : meta && meta.total > 0 ? (
                `Showing ${showingStart}-${showingEnd} of ${meta.total} candidates`
              ) : (
                `0 candidates`
              )}
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile filter */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                  {activeCount > 0 && (
                    <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <FilterSidebar {...filterProps} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
          {isLoading ? (
            Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))
          ) : (
            talents.map((t) => (
              <TalentCard key={t._id} talent={t} />
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoading && meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 pb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                posthog.capture('talent_pagination_clicked', { direction: 'previous', from_page: page, to_page: page - 1 });
                setPage(page - 1);
              }}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (meta.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= meta.totalPages - 2) {
                  pageNum = meta.totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      posthog.capture('talent_pagination_clicked', { direction: 'specific', from_page: page, to_page: pageNum });
                      setPage(pageNum);
                    }}
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                posthog.capture('talent_pagination_clicked', { direction: 'next', from_page: page, to_page: page + 1 });
                setPage(page + 1);
              }}
              disabled={page === meta.totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {!isLoading && talents.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-foreground">No candidates found</p>
            <p className="text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TalentSearch;
