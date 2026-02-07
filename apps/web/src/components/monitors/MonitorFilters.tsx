import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MonitorFiltersProps {
  projects: Array<{ id: string; name: string; color: string }>;
  allTags: string[];
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  search: string;
  projectId: string;
  status: string;
  tags: string[];
}

export function MonitorFilters({ projects, allTags, onFilterChange }: MonitorFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    projectId: 'all',
    status: 'all',
    tags: [],
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleProjectChange = (value: string) => {
    setFilters((prev) => ({ ...prev, projectId: value }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      projectId: 'all',
      status: 'all',
      tags: [],
    });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.projectId !== 'all' ||
    filters.status !== 'all' ||
    filters.tags.length > 0;

  return (
    <div className="space-y-4">
      {/* Main Search and Quick Filters */}
      <div className="flex items-center space-x-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search monitors by name or URL..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Project Filter */}
        <select
          value={filters.projectId}
          onChange={(e) => handleProjectChange(e.target.value)}
          className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Clients</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="flex h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="UP">Up</option>
          <option value="DOWN">Down</option>
          <option value="DEGRADED">Degraded</option>
          <option value="PAUSED">Paused</option>
        </select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {showAdvanced ? 'Hide' : 'Filters'}
          {filters.tags.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {filters.tags.length}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters - Tags */}
      {showAdvanced && allTags.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <h4 className="text-sm font-semibold mb-3">Filter by Tags</h4>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
                {filters.tags.includes(tag) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {filters.search && (
            <Badge variant="secondary">
              Search: "{filters.search}"
            </Badge>
          )}
          {filters.projectId !== 'all' && (
            <Badge variant="secondary">
              Client: {projects.find((p) => p.id === filters.projectId)?.name}
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge variant="secondary">
              Status: {filters.status}
            </Badge>
          )}
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              Tag: {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
