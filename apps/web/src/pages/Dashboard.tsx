import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, CheckCircle2, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/monitors/StatusIndicator';
import { ECGLoader } from '@/components/ui/ECGLoader';
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

  const loadDashboard = useCallback(async () => {
    try {
      const [summaryRes, projectsRes, activityRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/projects'),
        api.get('/dashboard/activity?limit=10'),
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
      <div className="flex items-center justify-center h-96">
        <ECGLoader text="Loading dashboard..." size="lg" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/monitors')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monitors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalMonitors}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Using {summary.totalMonitors} of 50 monitors
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/monitors')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Uptime</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {summary.uptimePercentage.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 24 hours - {summary.openIncidents} incidents
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/monitors')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatResponseTime(summary.avgResponseTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all active monitors
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/incidents')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{summary.openIncidents}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Health */}
      <Card>
        <CardHeader>
          <CardTitle>Projects Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => {
              const uptimeColor = project.uptimePercentage >= 99.9
                ? 'text-green-600'
                : project.uptimePercentage >= 99
                ? 'text-yellow-600'
                : 'text-red-600';

              return (
                <div
                  key={project.projectId}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/monitors?projectId=${project.projectId}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-lg">{project.projectName}</h4>
                        <Badge variant="outline">{project.totalMonitors} monitors</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {project.upMonitors} up
                        </span>
                        {project.downMonitors > 0 && (
                          <span className="flex items-center text-red-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {project.downMonitors} down
                          </span>
                        )}
                        {project.degradedMonitors > 0 && (
                          <span className="flex items-center text-yellow-600">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {project.degradedMonitors} degraded
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${uptimeColor}`}>
                        {project.uptimePercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">uptime</div>
                    </div>
                  </div>

                  {/* Visual uptime bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          project.uptimePercentage >= 99.9
                            ? 'bg-green-500'
                            : project.uptimePercentage >= 99
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
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
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 text-sm border-l-2 border-primary pl-4 py-2 hover:bg-muted/50 transition-colors rounded-r"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{log.action}</p>
                    {log.details && typeof log.details === 'object' && (
                      <p className="text-muted-foreground text-xs mt-1">
                        {Object.entries(log.details as Record<string, any>).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
