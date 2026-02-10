import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Pause, Play, Trash2, ExternalLink, RefreshCw, Eye, Pencil, Activity, Search, Zap, TrendingUp, Clock, PauseCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MonitorForm } from '@/components/MonitorForm';
import { StatusIndicator } from '@/components/monitors/StatusIndicator';
import { MonitorFilters, type FilterValues } from '@/components/monitors/MonitorFilters';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import type { Monitor, Project } from '@/types';
import { formatDate, getStatusColor, formatResponseTime } from '@/lib/utils';
import { toast } from 'sonner';

export function Monitors() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);

  // Get initial filters from URL params
  const initialProjectId = searchParams.get('projectId') || 'all';
  const initialStatus = searchParams.get('status') || 'all';

  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    projectId: initialProjectId,
    status: initialStatus,
    tags: [],
  });

  // Initial load and auto-refresh every 30 seconds
  useEffect(() => {
    loadMonitors();
    loadProjects();
    const interval = setInterval(loadMonitors, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.projectId !== 'all') params.projectId = filters.projectId;
    if (filters.status !== 'all') params.status = filters.status;
    setSearchParams(params);
  }, [filters.projectId, filters.status, setSearchParams]);

  const loadMonitors = async () => {
    setLoading(true);
    try {
      // Fetch all monitors (limit=500 to override default pagination of 20)
      const response = await api.get('/monitors?limit=200');
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

  const handlePauseAll = async () => {
    if (!confirm('Are you sure you want to pause ALL active monitors?')) return;

    setBulkLoading(true);
    try {
      const activeMonitors = monitors.filter(m => m.isActive);
      await Promise.all(activeMonitors.map(m => api.post(`/monitors/${m.id}/pause`)));
      toast.success(`Paused ${activeMonitors.length} monitors`);
      loadMonitors();
    } catch (error: any) {
      toast.error('Failed to pause some monitors');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleResumeAll = async () => {
    if (!confirm('Are you sure you want to resume ALL paused monitors?')) return;

    setBulkLoading(true);
    try {
      const pausedMonitors = monitors.filter(m => !m.isActive);
      await Promise.all(pausedMonitors.map(m => api.post(`/monitors/${m.id}/resume`)));
      toast.success(`Resumed ${pausedMonitors.length} monitors`);
      loadMonitors();
    } catch (error: any) {
      toast.error('Failed to resume some monitors');
    } finally {
      setBulkLoading(false);
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

      // Project filter - check both projectId and project.id
      if (filters.projectId !== 'all') {
        const monitorProjectId = (monitor as any).projectId || monitor.project?.id;
        if (monitorProjectId !== filters.projectId) {
          return false;
        }
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
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-14 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-36" />
              <div className="flex items-center space-x-2 pt-2">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitors</h1>
          <p className="text-muted-foreground">
            Showing {filteredMonitors.length} of {monitors.length} monitors
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={handlePauseAll}
                disabled={bulkLoading || monitors.filter(m => m.isActive).length === 0}
                className="btn-lift text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
              >
                <PauseCircle className="h-4 w-4 mr-2" />
                Pause All
              </Button>
              <Button
                variant="outline"
                onClick={handleResumeAll}
                disabled={bulkLoading || monitors.filter(m => !m.isActive).length === 0}
                className="btn-lift text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Resume All
              </Button>
            </>
          )}
          <Button variant="outline" onClick={loadMonitors} disabled={loading} className="btn-lift">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="btn-lift">
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
        initialStatus={initialStatus}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMonitors.map((monitor, index) => (
          <Card
            key={monitor.id}
            className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-transparent hover:border-primary/20"
            onClick={() => navigate(`/monitors/${monitor.id}`)}
            style={{ animationDelay: `${index * 50}ms` }}
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
              {/* Quick Stats Row */}
              <div className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">
                    {(monitor as any).lastResponseTimeMs
                      ? formatResponseTime((monitor as any).lastResponseTimeMs)
                      : '-'}
                  </span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={`font-medium ${
                    monitor.currentStatus === 'UP' ? 'text-green-600' :
                    monitor.currentStatus === 'DOWN' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {monitor.currentStatus === 'UP' ? '100% up' :
                     monitor.currentStatus === 'DOWN' ? 'Down' : 'Degraded'}
                  </span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{monitor.intervalSeconds}s</span>
                </div>
              </div>

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
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{monitor.method}</span>
                  {monitor.lastCheckAt && (
                    <span> • Checked {formatDate(monitor.lastCheckAt)}</span>
                  )}
                </div>
              </div>

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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            {monitors.length === 0 ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No monitors yet</h3>
                <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
                  Start monitoring your services by adding your first monitor
                </p>
                <Button onClick={() => setShowCreateForm(true)} className="btn-lift">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first monitor
                </Button>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No monitors found</h3>
                <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
                  No monitors match your current filters. Try adjusting your search.
                </p>
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
                  className="btn-lift"
                >
                  Clear all filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
