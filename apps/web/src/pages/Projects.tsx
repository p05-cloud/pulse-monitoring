import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, RefreshCw, Eye, ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/ProjectForm';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import type { Project } from '@/types';
import { toast } from 'sonner';

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all monitors associated with this client.`)) {
      return;
    }

    try {
      await api.delete(`/projects/${id}`);
      toast.success('Client deleted successfully');
      loadProjects();
      loadProjectStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete client');
    }
  };

  useEffect(() => {
    loadProjects();
    loadProjectStats();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectStats = async () => {
    try {
      const response = await api.get('/dashboard/projects');
      const statsMap: Record<string, any> = {};
      response.data.data.forEach((stat: any) => {
        statsMap[stat.projectId] = stat;
      });
      setProjectStats(statsMap);
    } catch (error: any) {
      console.error('Failed to load project stats');
    }
  };

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
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showCreateForm || editingProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {editingProject ? 'Edit Client' : 'Add New Client'}
          </h1>
          <Button variant="outline" onClick={() => { setShowCreateForm(false); setEditingProject(null); }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
        <ProjectForm
          project={editingProject ? {
            id: editingProject.id,
            name: editingProject.name,
            description: editingProject.description || undefined,
            color: editingProject.color,
          } : undefined}
          onSuccess={() => {
            setShowCreateForm(false);
            setEditingProject(null);
            loadProjects();
            loadProjectStats();
          }}
          onCancel={() => { setShowCreateForm(false); setEditingProject(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            {projects.length === 0
              ? 'Add your first client to start monitoring'
              : `Monitor and track ${projects.length} client${projects.length === 1 ? '' : 's'} in real-time`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadProjects} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const stats = projectStats[project.id];

          return (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
              onClick={() => {
                navigate(`/monitors?projectId=${project.id}`);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats ? (
                  <>
                    {/* Monitor Stats */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monitors</span>
                      <Badge variant="secondary">{stats.totalMonitors}</Badge>
                    </div>

                    {/* Status Breakdown */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Up</span>
                        <span className="font-semibold text-green-600">{stats.upMonitors}</span>
                      </div>
                      {stats.downMonitors > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-600">Down</span>
                          <span className="font-semibold text-red-600">{stats.downMonitors}</span>
                        </div>
                      )}
                      {stats.degradedMonitors > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-yellow-600">Degraded</span>
                          <span className="font-semibold text-yellow-600">{stats.degradedMonitors}</span>
                        </div>
                      )}
                    </div>

                    {/* Uptime */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Uptime</span>
                        <span className="text-lg font-bold text-green-600">
                          {stats.uptimePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${stats.uptimePercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/monitors?projectId=${project.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Monitors
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project.id, project.name);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant="secondary">No monitors yet</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No clients yet</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first client
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
