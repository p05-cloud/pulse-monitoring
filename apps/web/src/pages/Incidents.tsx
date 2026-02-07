import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, ChevronDown, ChevronRight, Download, FileJson, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/monitors/StatusIndicator';
import api from '@/lib/api';
import type { Incident } from '@/types';
import { formatDate, formatDuration, getIncidentStatusColor } from '@/lib/utils';
import { toast } from 'sonner';

export function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'>('all');
  const [expandedRCA, setExpandedRCA] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, [filter]);

  const loadIncidents = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/incidents', { params });
      setIncidents(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.post(`/incidents/${id}/acknowledge`);
      toast.success('Incident acknowledged');
      loadIncidents();
    } catch (error: any) {
      toast.error('Failed to acknowledge incident');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.post(`/incidents/${id}/resolve`);
      toast.success('Incident resolved');
      loadIncidents();
    } catch (error: any) {
      toast.error('Failed to resolve incident');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading incidents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incidents</h1>
          <p className="text-muted-foreground">
            Monitor downtime incidents and root causes ({incidents.length} total)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Export Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('format', 'csv');
                      if (filter !== 'all') params.set('status', filter);
                      window.open(`${api.defaults.baseURL}/incidents/export?${params.toString()}`, '_blank');
                      setShowExportMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('format', 'json');
                      if (filter !== 'all') params.set('status', filter);
                      window.open(`${api.defaults.baseURL}/incidents/export?${params.toString()}`, '_blank');
                      setShowExportMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    Export as JSON
                  </button>
                </div>
              </>
            )}
          </div>
          <Button variant="outline" onClick={loadIncidents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'OPEN' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('OPEN')}
        >
          Open
        </Button>
        <Button
          variant={filter === 'ACKNOWLEDGED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('ACKNOWLEDGED')}
        >
          Acknowledged
        </Button>
        <Button
          variant={filter === 'RESOLVED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('RESOLVED')}
        >
          Resolved
        </Button>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents.map((incident) => {
          const isRCAExpanded = expandedRCA.has(incident.id);

          return (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      {incident.status === 'RESOLVED' ? (
                        <StatusIndicator status="UP" size="sm" showLabel={false} />
                      ) : (
                        <StatusIndicator status="DOWN" size="sm" showLabel={false} />
                      )}
                      <CardTitle className="text-lg">
                        {incident.monitor?.name || 'Unknown Monitor'}
                      </CardTitle>
                      <Badge className={getIncidentStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                    </div>
                    {incident.monitor && (
                      <p className="text-sm text-muted-foreground">
                        {incident.monitor.url}
                      </p>
                    )}
                  </div>
                <div className="flex items-center space-x-2">
                  {incident.status === 'OPEN' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcknowledge(incident.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {(incident.status === 'OPEN' || incident.status === 'ACKNOWLEDGED') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(incident.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timeline */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Started
                  </div>
                  <p className="font-mono text-xs">{formatDate(incident.startedAt)}</p>
                </div>
                {incident.acknowledgedAt && (
                  <div>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Clock className="h-4 w-4 mr-1" />
                      Acknowledged
                    </div>
                    <p className="font-mono text-xs">{formatDate(incident.acknowledgedAt)}</p>
                  </div>
                )}
                {incident.resolvedAt && (
                  <div>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Resolved
                    </div>
                    <p className="font-mono text-xs">{formatDate(incident.resolvedAt)}</p>
                  </div>
                )}
              </div>

              {/* Duration */}
              {incident.durationSeconds !== null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Duration: </span>
                  <span className="font-semibold">
                    {formatDuration(incident.durationSeconds)}
                  </span>
                </div>
              )}

              {/* Error Info */}
              {incident.errorCategory && (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Error Category: </span>
                    <Badge variant="destructive">{incident.errorCategory}</Badge>
                  </div>
                  {incident.errorMessage && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Message: </span>
                      <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                        {incident.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* RCA Details */}
              {incident.rcaDetails && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedRCA);
                      if (isRCAExpanded) {
                        newExpanded.delete(incident.id);
                      } else {
                        newExpanded.add(incident.id);
                      }
                      setExpandedRCA(newExpanded);
                    }}
                    className="flex items-center space-x-2 font-semibold text-sm hover:text-primary transition-colors w-full text-left"
                  >
                    {isRCAExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>Root Cause Analysis</span>
                  </button>
                  {isRCAExpanded && (
                    <div className="space-y-2 text-sm mt-3">
                    {incident.rcaDetails.phases.dns && (
                      <div className="grid grid-cols-3 gap-2 bg-muted p-2 rounded">
                        <span className="text-muted-foreground">DNS:</span>
                        <span className={incident.rcaDetails.phases.dns.success ? 'text-green-600' : 'text-red-600'}>
                          {incident.rcaDetails.phases.dns.success ? '✓' : '✗'} {incident.rcaDetails.phases.dns.durationMs}ms
                        </span>
                        {incident.rcaDetails.phases.dns.resolvedIp && (
                          <span className="font-mono text-xs">{incident.rcaDetails.phases.dns.resolvedIp}</span>
                        )}
                      </div>
                    )}
                    {incident.rcaDetails.phases.tcp && (
                      <div className="grid grid-cols-3 gap-2 bg-muted p-2 rounded">
                        <span className="text-muted-foreground">TCP:</span>
                        <span className={incident.rcaDetails.phases.tcp.success ? 'text-green-600' : 'text-red-600'}>
                          {incident.rcaDetails.phases.tcp.success ? '✓' : '✗'} {incident.rcaDetails.phases.tcp.durationMs}ms
                        </span>
                      </div>
                    )}
                    {incident.rcaDetails.phases.tls && (
                      <div className="grid grid-cols-3 gap-2 bg-muted p-2 rounded">
                        <span className="text-muted-foreground">TLS/SSL:</span>
                        <span className={incident.rcaDetails.phases.tls.success ? 'text-green-600' : 'text-red-600'}>
                          {incident.rcaDetails.phases.tls.success ? '✓' : '✗'} {incident.rcaDetails.phases.tls.durationMs}ms
                        </span>
                        {incident.rcaDetails.phases.tls.certExpires && (
                          <span className="text-xs">Expires: {new Date(incident.rcaDetails.phases.tls.certExpires).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                    {incident.rcaDetails.phases.http && (
                      <div className="grid grid-cols-3 gap-2 bg-muted p-2 rounded">
                        <span className="text-muted-foreground">HTTP:</span>
                        <span className={incident.rcaDetails.phases.http.success ? 'text-green-600' : 'text-red-600'}>
                          {incident.rcaDetails.phases.http.success ? '✓' : '✗'} {incident.rcaDetails.phases.http.durationMs}ms
                        </span>
                        {incident.rcaDetails.phases.http.statusCode && (
                          <span className="font-mono text-xs">HTTP {incident.rcaDetails.phases.http.statusCode}</span>
                        )}
                      </div>
                    )}
                      <div className="grid grid-cols-3 gap-2 bg-primary/10 p-2 rounded font-semibold">
                        <span>Total:</span>
                        <span>{incident.rcaDetails.totalDurationMs}ms</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {incident.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm">Notes</h4>
                  <p className="text-sm text-muted-foreground">{incident.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>

      {incidents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-muted-foreground">No {filter !== 'all' ? filter.toLowerCase() : ''} incidents</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
