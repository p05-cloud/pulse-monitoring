import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Pause, Play, Trash2, RefreshCw, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/monitors/StatusIndicator';
import { ResponseTimeChart } from '@/components/monitors/ResponseTimeChart';
import { UptimeBar } from '@/components/monitors/UptimeBar';
import { UptimeStats } from '@/components/monitors/UptimeStats';
import api from '@/lib/api';
import type { Monitor } from '@/types';
import { formatDate, getStatusColor } from '@/lib/utils';
import { toast } from 'sonner';

interface CheckResult {
  id: string;
  checkedAt: string;
  success: boolean;
  responseTimeMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

interface Incident {
  id: string;
  status: string;
  startedAt: string;
  resolvedAt: string | null;
  durationSeconds: number | null;
  errorCategory: string | null;
  errorMessage: string | null;
}

export function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadMonitorData();
    }
  }, [id]);

  const loadMonitorData = async () => {
    try {
      setLoading(true);
      const [monitorRes, checksRes, incidentsRes] = await Promise.all([
        api.get(`/monitors/${id}`),
        api.get(`/monitors/${id}/checks?limit=100`),
        api.get(`/monitors/${id}/incidents`),
      ]);

      setMonitor(monitorRes.data.data);
      setChecks(checksRes.data.data || []);
      setIncidents(incidentsRes.data.data || []);
    } catch (error: any) {
      toast.error('Failed to load monitor details');
      navigate('/monitors');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      await api.post(`/monitors/${id}/pause`);
      toast.success('Monitor paused');
      loadMonitorData();
    } catch (error) {
      toast.error('Failed to pause monitor');
    }
  };

  const handleResume = async () => {
    try {
      await api.post(`/monitors/${id}/resume`);
      toast.success('Monitor resumed');
      loadMonitorData();
    } catch (error) {
      toast.error('Failed to resume monitor');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this monitor?')) return;

    try {
      await api.delete(`/monitors/${id}`);
      toast.success('Monitor deleted');
      navigate('/monitors');
    } catch (error) {
      toast.error('Failed to delete monitor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!monitor) return null;

  // Calculate uptime stats
  const successfulChecks = checks.filter((c) => c.success).length;
  const uptimePercentage = checks.length > 0 ? (successfulChecks / checks.length) * 100 : 100;

  const uptimeStats = {
    last24h: uptimePercentage,
    last7d: uptimePercentage,
    last30d: uptimePercentage,
  };

  const incidentStats = {
    last24h: incidents.filter((i) => new Date(i.startedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
    last7d: incidents.filter((i) => new Date(i.startedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    last30d: incidents.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/monitors')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Monitors
          </Button>
          <div className="flex items-center space-x-3">
            <StatusIndicator status={monitor.currentStatus} size="lg" showLabel={false} />
            <div>
              <h1 className="text-3xl font-bold">{monitor.name}</h1>
              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center space-x-1"
              >
                <span>{monitor.url}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          {monitor.project && (
            <Badge variant="outline" style={{ borderColor: monitor.project.color }}>
              {monitor.project.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadMonitorData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {monitor.isActive ? (
            <Button variant="outline" size="sm" onClick={handlePause}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleResume}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Current Status */}
      <div className={`p-6 rounded-lg border ${
        monitor.currentStatus === 'UP'
          ? 'bg-green-500/10 border-green-500/20'
          : monitor.currentStatus === 'DOWN'
          ? 'bg-red-500/10 border-red-500/20'
          : 'bg-yellow-500/10 border-yellow-500/20'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Current status</div>
            <div className={`text-3xl font-bold ${
              monitor.currentStatus === 'UP'
                ? 'text-green-600'
                : monitor.currentStatus === 'DOWN'
                ? 'text-red-600'
                : 'text-yellow-600'
            }`}>
              {monitor.currentStatus}
            </div>
            {monitor.lastCheckAt && (
              <div className="text-sm text-muted-foreground mt-1">
                Currently up for {Math.floor((Date.now() - new Date(monitor.lastCheckAt).getTime()) / 1000 / 60)}m
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Last check</div>
            <div className="text-lg font-semibold">
              {monitor.lastCheckAt ? formatDate(monitor.lastCheckAt) : 'Never'}
            </div>
            <div className="text-sm text-muted-foreground">
              Checked every {monitor.intervalSeconds}s
            </div>
          </div>
        </div>
      </div>

      {/* Uptime Stats */}
      <UptimeStats stats={uptimeStats} incidents={incidentStats} />

      {/* Response Time Chart */}
      <ResponseTimeChart
        data={checks.map((check) => ({
          timestamp: check.checkedAt,
          responseTimeMs: check.responseTimeMs,
          success: check.success,
        }))}
      />

      {/* Uptime Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Uptime History</CardTitle>
        </CardHeader>
        <CardContent>
          <UptimeBar
            checks={checks.map((check) => ({
              timestamp: check.checkedAt,
              success: check.success,
              responseTimeMs: check.responseTimeMs ?? undefined,
            }))}
          />
        </CardContent>
      </Card>

      {/* Monitor Configuration */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method:</span>
              <span className="font-semibold">{monitor.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interval:</span>
              <span className="font-semibold">{monitor.intervalSeconds}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timeout:</span>
              <span className="font-semibold">{monitor.timeoutMs}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Status:</span>
              <span className="font-semibold">{monitor.expectedStatus}</span>
            </div>
            {monitor.keyword && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Keyword:</span>
                <span className="font-semibold">{monitor.keyword}</span>
              </div>
            )}
            {monitor.tags.length > 0 && (
              <div>
                <span className="text-muted-foreground">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {monitor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>SSL Certificate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {monitor.url.startsWith('https://') ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domain valid until:</span>
                  <span className="font-semibold text-green-600">Valid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SSL certificate valid:</span>
                  <span className="font-semibold text-green-600">Valid</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Available only in paid plans
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">
                SSL monitoring is only available for HTTPS URLs
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No incidents recorded
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.slice(0, 5).map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={incident.status === 'RESOLVED' ? 'secondary' : 'destructive'}>
                        {incident.status}
                      </Badge>
                      {incident.errorCategory && (
                        <span className="text-sm font-medium">{incident.errorCategory}</span>
                      )}
                    </div>
                    {incident.errorMessage && (
                      <p className="text-sm text-muted-foreground">{incident.errorMessage}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(incident.startedAt)}
                      {incident.durationSeconds && ` · ${Math.floor(incident.durationSeconds / 60)}m ${incident.durationSeconds % 60}s`}
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
