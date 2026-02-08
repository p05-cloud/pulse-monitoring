import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, CheckCircle2, Clock, TrendingUp, RefreshCw, ArrowUpRight, Filter, User, LogIn, Settings, Plus, Trash2, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/monitors/StatusIndicator';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonStatCard } from '@/components/ui/Skeleton';
import { Gauge } from '@/components/ui/Gauge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import type { DashboardSummary, ProjectHealth, ActivityLogEntry } from '@/types';
import { formatDate, formatResponseTime } from '@/lib/utils';
import { toast } from 'sonner';

export function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [projects, setProjects] = useState<ProjectHealth[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<'all' | 'login' | 'monitor' | 'incident' | 'settings'>('all');
  const [projectView, setProjectView] = useState<'gauge' | 'list'>('gauge');

  const loadDashboard = useCallback(async () => {
    try {
      const [summaryRes, projectsRes, activityRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/projects'),
        api.get('/dashboard/activity?limit=50'),
      ]);

      setSummary(summaryRes.data.data);
      setProjects(projectsRes.data.data);
      setActivity(activityRes.data.data);
    } catch (error: any) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and auto-refresh every 30 seconds
  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-8 w-40" />
            <div className="skeleton h-4 w-64" />
          </div>
          <div className="skeleton h-10 w-24 rounded-md" />
        </div>
        <div className="skeleton h-36 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="skeleton h-64 rounded-lg" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your monitoring infrastructure
          </p>
        </div>
        <Button variant="outline" onClick={loadDashboard} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Current Status Banner */}
      <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <StatusIndicator status="UP" size="lg" showLabel={false} />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Current Status</h2>
              <p className="text-muted-foreground">All systems operational</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {summary.upMonitors}
            </div>
            <div className="text-sm text-muted-foreground">Monitors Up</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div
            className="text-center cursor-pointer hover:bg-red-500/10 rounded-lg p-2 transition-colors"
            onClick={() => navigate('/monitors?status=DOWN')}
          >
            <div className="text-2xl font-bold text-foreground">{summary.downMonitors}</div>
            <div className="text-xs text-muted-foreground">Down</div>
          </div>
          <div
            className="text-center cursor-pointer hover:bg-yellow-500/10 rounded-lg p-2 transition-colors"
            onClick={() => navigate('/monitors?status=DEGRADED')}
          >
            <div className="text-2xl font-bold text-foreground">{summary.degradedMonitors || 0}</div>
            <div className="text-xs text-muted-foreground">Degraded</div>
          </div>
          <div
            className="text-center cursor-pointer hover:bg-gray-500/10 rounded-lg p-2 transition-colors"
            onClick={() => navigate('/monitors?status=PAUSED')}
          >
            <div className="text-2xl font-bold text-foreground">{summary.pausedMonitors || 0}</div>
            <div className="text-xs text-muted-foreground">Paused</div>
          </div>
        </div>
      </div>

      {/* Summary Cards - ATIS-style gradient cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Monitors"
          value={summary.totalMonitors}
          subtitle="Active monitors in your infrastructure"
          icon={Activity}
          variant="info"
          onClick={() => navigate('/monitors')}
        />

        <StatCard
          title="Overall Uptime"
          value={`${summary.uptimePercentage.toFixed(2)}%`}
          subtitle={`Last 24 hours - ${summary.openIncidents} incidents`}
          icon={CheckCircle2}
          variant="success"
          onClick={() => navigate('/monitors')}
        />

        <StatCard
          title="Avg Response"
          value={formatResponseTime(summary.avgResponseTime)}
          subtitle="Across all active monitors"
          icon={Clock}
          variant="default"
          onClick={() => navigate('/monitors')}
        />

        <StatCard
          title="Open Incidents"
          value={summary.openIncidents}
          subtitle="Require immediate attention"
          icon={AlertCircle}
          variant={summary.openIncidents > 0 ? 'danger' : 'success'}
          onClick={() => navigate('/incidents')}
        />
      </div>

      {/* Client Service Availability */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
          <CardTitle className="flex items-center justify-between">
            <span>Service Availability</span>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={projectView === 'gauge' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setProjectView('gauge')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={projectView === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setProjectView('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-muted-foreground hover:text-foreground">
                View all <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projectView === 'gauge' ? (
            /* Gauge View - Auto-fit grid that expands based on content */
            <div className="p-6">
              <div className="flex flex-wrap justify-center gap-6">
                {projects.map((project, index) => (
                  <div
                    key={project.projectId}
                    className="flex flex-col items-center p-4 rounded-xl hover:bg-muted/50 cursor-pointer transition-all duration-300 hover:scale-105 w-[160px] min-w-[140px]"
                    onClick={() => navigate(`/monitors?projectId=${project.projectId}`)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Gauge
                      value={project.uptimePercentage}
                      size="md"
                      animated={true}
                    />
                    <h4 className="font-medium text-sm mt-3 text-center line-clamp-2 w-full">
                      {project.projectName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {project.totalMonitors} monitors
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      {project.upMonitors > 0 && (
                        <span className="text-green-600">{project.upMonitors} up</span>
                      )}
                      {project.downMonitors > 0 && (
                        <span className="text-red-600">{project.downMonitors} down</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="divide-y">
              {projects.map((project, index) => {
                const uptimeColor = project.uptimePercentage >= 99.9
                  ? 'text-green-600'
                  : project.uptimePercentage >= 99
                  ? 'text-yellow-600'
                  : 'text-red-600';

                const bgGradient = project.uptimePercentage >= 99.9
                  ? 'hover:bg-gradient-to-r hover:from-green-500/5 hover:to-transparent'
                  : project.uptimePercentage >= 99
                  ? 'hover:bg-gradient-to-r hover:from-yellow-500/5 hover:to-transparent'
                  : 'hover:bg-gradient-to-r hover:from-red-500/5 hover:to-transparent';

                return (
                  <div
                    key={project.projectId}
                    className={`p-5 cursor-pointer transition-all duration-200 ${bgGradient}`}
                    onClick={() => navigate(`/monitors?projectId=${project.projectId}`)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-base">{project.projectName}</h4>
                          <Badge variant="secondary" className="font-normal">
                            {project.totalMonitors} monitors
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            {project.upMonitors} up
                          </span>
                          {project.downMonitors > 0 && (
                            <span className="flex items-center text-red-600">
                              <AlertCircle className="h-3.5 w-3.5 mr-1" />
                              {project.downMonitors} down
                            </span>
                          )}
                          {project.degradedMonitors > 0 && (
                            <span className="flex items-center text-yellow-600">
                              <TrendingUp className="h-3.5 w-3.5 mr-1" />
                              {project.degradedMonitors} degraded
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold tracking-tight ${uptimeColor}`}>
                          {project.uptimePercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">uptime</div>
                      </div>
                    </div>

                    {/* Visual uptime bar */}
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            project.uptimePercentage >= 99.9
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : project.uptimePercentage >= 99
                              ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                              : 'bg-gradient-to-r from-red-500 to-rose-500'
                          }`}
                          style={{ width: `${project.uptimePercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 incidents, 0m down</span>
                        <span>Last 24 hours</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
          <CardTitle className="flex items-center justify-between">
            <span>Recent Activity</span>
            <Select value={activityFilter} onValueChange={(v: any) => setActivityFilter(v)}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
                <SelectItem value="monitor">Monitors</SelectItem>
                <SelectItem value="incident">Incidents</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activity.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Activity className="h-8 w-8 opacity-50" />
              </div>
              <p className="font-medium">No recent activity</p>
              <p className="text-sm mt-1">Activity will appear here when actions are taken</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y">
              {activity
                .filter(log => {
                  if (activityFilter === 'all') return true;
                  const action = log.action.toLowerCase();
                  if (activityFilter === 'login') return action.includes('login') || action.includes('logged');
                  if (activityFilter === 'monitor') return action.includes('monitor');
                  if (activityFilter === 'incident') return action.includes('incident');
                  if (activityFilter === 'settings') return action.includes('setting') || action.includes('config') || action.includes('update');
                  return true;
                })
                .map((log, index) => {
                  // Determine activity icon based on action type
                  const action = log.action.toLowerCase();
                  let ActivityIcon = Activity;
                  let iconColor = 'text-primary';
                  if (action.includes('login') || action.includes('logged')) {
                    ActivityIcon = LogIn;
                    iconColor = 'text-blue-500';
                  } else if (action.includes('created') || action.includes('added')) {
                    ActivityIcon = Plus;
                    iconColor = 'text-green-500';
                  } else if (action.includes('deleted') || action.includes('removed')) {
                    ActivityIcon = Trash2;
                    iconColor = 'text-red-500';
                  } else if (action.includes('updated') || action.includes('modified')) {
                    ActivityIcon = Settings;
                    iconColor = 'text-amber-500';
                  }

                  // Get user info from log
                  const userEmail = (log as any).user?.email || (log.details as any)?.email || 'System';

                  return (
                    <div
                      key={log.id}
                      className="flex items-start space-x-4 p-4 hover:bg-muted/30 transition-colors"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm text-foreground">{log.action}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{userEmail}</span>
                        </div>
                        {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 && (
                          <p className="text-muted-foreground text-xs mt-1">
                            {Object.entries(log.details as Record<string, any>)
                              .filter(([key]) => key !== 'email')
                              .map(([key, value]) => (
                                <span key={key} className="mr-2 inline-flex items-center">
                                  <span className="font-medium">{key}:</span>
                                  <span className="ml-1">{String(value)}</span>
                                </span>
                              ))}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
