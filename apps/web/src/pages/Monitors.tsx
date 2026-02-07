import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Pause, Play, Trash2, ExternalLink, RefreshCw, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MonitorForm } from '@/components/MonitorForm';
import { StatusIndicator } from '@/components/monitors/StatusIndicator';
import { MonitorFilters, type FilterValues } from '@/components/monitors/MonitorFilters';
import api from '@/lib/api';
import type { Monitor, Project } from '@/types';
import { formatDate, getStatusColor } from '@/lib/utils';
import { toast } from 'sonner';

export function Monitors() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);

  // Get initial projectId from URL params
  const initialProjectId = searchParams.get('projectId') || 'all';

  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    projectId: initialProjectId,
    status: 'all',
    tags: [],
  });

  useEffect(() => {
    loadMonitors();
    loadProjects();
  }, []);

  // Update URL when project filter changes
  useEffect(() => {
    if (filters.projectId !== 'all') {
      setSearchParams({ projectId: filters.projectId });
    } else {
      setSearchParams({});
    }
  }, [filters.projectId, setSearchParams]);

  const loadMonitors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/monitors');
      setMonitors(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load monitors');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (error: any) {
      console.error('Failed to load projects');
    }
  };

  const handlePause = async (id: string) => {
    try {
      await api.post(`/monitors/${id}/pause`);
      toast.success('Monitor paused');
      loadMonitors();
    } catch (error: any) {
      toast.error('Failed to pause monitor');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await api.post(`/monitors/${id}/resume`);
      toast.success('Monitor resumed');
      loadMonitors();
    } catch (error: any) {
      toast.error('Failed to resume monitor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this monitor?')) return;

    try {
      await api.delete(`/monitors/${id}`);
      toast.success('Monitor deleted');
      loadMonitors();
    } catch (error: any) {
      toast.error('Failed to delete monitor');
    }
  };

  // Extract all unique tags from monitors
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    monitors.forEach((monitor) => {
      monitor.tags.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [monitors]);

  // Filter monitors based on active filters
  const filteredMonitors = useMemo(() => {
    return monitors.filter((monitor) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          monitor.name.toLowerCase().includes(searchLower) ||
          monitor.url.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Project filter
      if (filters.projectId !== 'all' && monitor.project?.id !== filters.projectId) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && monitor.currentStatus !== filters.status) {
        return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasAllTags = filters.tags.every((tag) => monitor.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [monitors, filters]);

  if (showCreateForm || editingMonitor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {editingMonitor ? 'Edit Monitor' : 'Create Monitor'}
          </h1>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateForm(false);
              setEditingMonitor(null);
            }}
          >
            Back to Monitors
          </Button>
        </div>
        <MonitorForm
          monitorId={editingMonitor?.id}
          initialData={editingMonitor || undefined}
          onSuccess={() => {
            setShowCreateForm(false);
            setEditingMonitor(null);
            loadMonitors();
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingMonitor(null);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading monitors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitors</h1>
          <p className="text-muted-foreground">
            Showing {filteredMonitors.length} of {monitors.length} monitors
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadMonitors} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Monitor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <MonitorFilters
        projects={projects}
        allTags={allTags}
        onFilterChange={setFilters}
        initialProjectId={initialProjectId}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMonitors.map((monitor) => (
          <Card
            key={monitor.id}
            className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
            onClick={() => navigate(`/monitors/${monitor.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status={monitor.currentStatus} size="sm" showLabel={false} />
                    <CardTitle className="text-lg">{monitor.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <Badge className={getStatusColor(monitor.currentStatus)}>
                      {monitor.currentStatus}
                    </Badge>
                    {monitor.monitorType === 'AGGREGATOR' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        AGGREGATOR
                      </Badge>
                    )}
                    {monitor.project && (
                      <Badge variant="outline" style={{ borderColor: monitor.project.color }}>
                        {monitor.project.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a
                    href={monitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {monitor.url}
                  </a>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{monitor.method}</span> • Every {monitor.intervalSeconds}s
                </div>
              </div>

              {monitor.lastCheckAt && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Last checked:</p>
                  <p className="font-mono text-xs">{formatDate(monitor.lastCheckAt)}</p>
                </div>
              )}

              {monitor.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {monitor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/monitors/${monitor.id}`);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingMonitor(monitor);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {monitor.isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePause(monitor.id);
                    }}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResume(monitor.id);
                    }}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(monitor.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMonitors.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {monitors.length === 0 ? (
              <>
                <p className="text-muted-foreground mb-4">No monitors yet</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first monitor
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">No monitors match your filters</p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      search: '',
                      projectId: 'all',
                      status: 'all',
                      tags: [],
                    })
                  }
                >
                  Clear Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
