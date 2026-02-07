import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tv,
  Maximize2,
  Grid3X3,
  Settings2,
  Plus,
  Trash2,
  RefreshCw,
  Activity,
  AlertTriangle,
  Clock,
  Server,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Widget {
  id: string;
  type: 'status-overview' | 'incident-list' | 'uptime-chart' | 'response-time' | 'project-health' | 'sla-status';
  title: string;
  size: 'small' | 'medium' | 'large';
  projectId?: string;
}

interface MonitorStatus {
  id: string;
  name: string;
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'MAINTENANCE';
  responseTime: number;
  uptime: number;
}

const defaultWidgets: Widget[] = [
  { id: '1', type: 'status-overview', title: 'Status Overview', size: 'large' },
  { id: '2', type: 'incident-list', title: 'Active Incidents', size: 'medium' },
  { id: '3', type: 'uptime-chart', title: 'Uptime (24h)', size: 'medium' },
  { id: '4', type: 'response-time', title: 'Response Times', size: 'small' },
];

export default function CustomDashboard() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTvMode, setIsTvMode] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [monitors, setMonitors] = useState<MonitorStatus[]>([]);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/monitors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMonitors(
          data.data?.map((m: any) => ({
            id: m.id,
            name: m.name,
            status: m.status,
            responseTime: m.lastResponseTime || 0,
            uptime: m.uptimePercentage || 100,
          })) || []
        );
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // Toggle TV Mode (fullscreen)
  const toggleTvMode = useCallback(() => {
    if (!isTvMode) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsTvMode(!isTvMode);
  }, [isTvMode]);

  // Exit TV mode on escape
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsTvMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const addWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      title: type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      size: 'medium',
    };
    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const getStatusCounts = () => {
    const counts = { up: 0, down: 0, degraded: 0, maintenance: 0 };
    monitors.forEach(m => {
      if (m.status === 'UP') counts.up++;
      else if (m.status === 'DOWN') counts.down++;
      else if (m.status === 'DEGRADED') counts.degraded++;
      else if (m.status === 'MAINTENANCE') counts.maintenance++;
    });
    return counts;
  };

  const renderWidget = (widget: Widget) => {
    const counts = getStatusCounts();

    switch (widget.type) {
      case 'status-overview':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusCard
              label="Operational"
              value={counts.up}
              icon={<ArrowUpRight className="h-5 w-5" />}
              color="green"
              tvMode={isTvMode}
            />
            <StatusCard
              label="Down"
              value={counts.down}
              icon={<ArrowDownRight className="h-5 w-5" />}
              color="red"
              tvMode={isTvMode}
            />
            <StatusCard
              label="Degraded"
              value={counts.degraded}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="yellow"
              tvMode={isTvMode}
            />
            <StatusCard
              label="Maintenance"
              value={counts.maintenance}
              icon={<Clock className="h-5 w-5" />}
              color="blue"
              tvMode={isTvMode}
            />
          </div>
        );

      case 'incident-list':
        const downMonitors = monitors.filter(m => m.status === 'DOWN' || m.status === 'DEGRADED');
        return (
          <div className="space-y-2">
            {downMonitors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>All systems operational</p>
              </div>
            ) : (
              downMonitors.slice(0, 5).map(m => (
                <div
                  key={m.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    m.status === 'DOWN' ? 'bg-red-500/10 border border-red-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-3 w-3 rounded-full animate-pulse',
                        m.status === 'DOWN' ? 'bg-red-500' : 'bg-yellow-500'
                      )}
                    />
                    <span className={cn(isTvMode && 'text-lg')}>{m.name}</span>
                  </div>
                  <span className={cn('text-sm', isTvMode && 'text-base')}>
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        );

      case 'uptime-chart':
        return (
          <div className="space-y-3">
            {monitors.slice(0, 6).map(m => (
              <div key={m.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className={cn(isTvMode && 'text-base')}>{m.name}</span>
                  <span className={cn('text-green-500', isTvMode && 'text-base')}>
                    {m.uptime.toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${m.uptime}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'response-time':
        const avgResponseTime =
          monitors.length > 0
            ? monitors.reduce((acc, m) => acc + m.responseTime, 0) / monitors.length
            : 0;
        return (
          <div className="text-center py-4">
            <div className={cn('text-4xl font-bold text-green-500', isTvMode && 'text-6xl')}>
              {avgResponseTime.toFixed(0)}
              <span className="text-lg text-muted-foreground ml-1">ms</span>
            </div>
            <p className={cn('text-muted-foreground mt-2', isTvMode && 'text-lg')}>
              Average Response Time
            </p>
          </div>
        );

      case 'project-health':
        return (
          <div className="grid grid-cols-2 gap-3">
            {monitors.slice(0, 4).map(m => (
              <div
                key={m.id}
                className={cn(
                  'p-4 rounded-lg border',
                  m.status === 'UP'
                    ? 'border-green-500/20 bg-green-500/5'
                    : m.status === 'DOWN'
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-yellow-500/20 bg-yellow-500/5'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4" />
                  <span className={cn('font-medium truncate', isTvMode && 'text-lg')}>
                    {m.name}
                  </span>
                </div>
                <div className={cn('text-2xl font-bold', isTvMode && 'text-3xl')}>
                  {m.responseTime}ms
                </div>
              </div>
            ))}
          </div>
        );

      case 'sla-status':
        const overallUptime =
          monitors.length > 0
            ? monitors.reduce((acc, m) => acc + m.uptime, 0) / monitors.length
            : 100;
        const slaTarget = 99.9;
        const slaStatus = overallUptime >= slaTarget ? 'MEETING' : 'BREACHING';
        return (
          <div className="text-center py-4">
            <div
              className={cn(
                'text-5xl font-bold',
                isTvMode && 'text-7xl',
                overallUptime >= slaTarget ? 'text-green-500' : 'text-red-500'
              )}
            >
              {overallUptime.toFixed(3)}%
            </div>
            <p className={cn('text-muted-foreground mt-2', isTvMode && 'text-lg')}>
              SLA Target: {slaTarget}%
            </p>
            <div
              className={cn(
                'inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full text-sm',
                isTvMode && 'text-base px-4 py-2',
                slaStatus === 'MEETING'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              )}
            >
              {slaStatus === 'MEETING' ? (
                <>
                  <ArrowUpRight className="h-4 w-4" /> Meeting SLA
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" /> SLA at Risk
                </>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getWidgetGridClass = (size: Widget['size']) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-2 lg:col-span-4';
    }
  };

  return (
    <div
      className={cn(
        'space-y-6 transition-all duration-300',
        isTvMode && 'fixed inset-0 z-50 bg-background p-8 overflow-auto'
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center justify-between', isTvMode && 'mb-8')}>
        <div>
          <h1 className={cn('text-2xl font-bold', isTvMode && 'text-4xl')}>
            {isTvMode ? 'PULSE Monitoring' : 'Custom Dashboard'}
          </h1>
          <p className={cn('text-muted-foreground', isTvMode && 'text-lg')}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isTvMode && (
            <>
              <Select
                value={refreshInterval.toString()}
                onValueChange={(v: string) => setRefreshInterval(parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 sec</SelectItem>
                  <SelectItem value="30">30 sec</SelectItem>
                  <SelectItem value="60">1 min</SelectItem>
                  <SelectItem value="300">5 min</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={isEditMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                {isEditMode ? 'Done' : 'Edit'}
              </Button>
            </>
          )}

          <Button
            variant={isTvMode ? 'default' : 'outline'}
            size={isTvMode ? 'lg' : 'sm'}
            onClick={toggleTvMode}
          >
            {isTvMode ? (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Exit TV Mode
              </>
            ) : (
              <>
                <Tv className="h-4 w-4 mr-2" />
                TV Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Add Widget Panel */}
      {isEditMode && !isTvMode && (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Add Widget:</span>
              {[
                { type: 'status-overview', label: 'Status Overview' },
                { type: 'incident-list', label: 'Incidents' },
                { type: 'uptime-chart', label: 'Uptime Chart' },
                { type: 'response-time', label: 'Response Time' },
                { type: 'project-health', label: 'Project Health' },
                { type: 'sla-status', label: 'SLA Status' },
              ].map(item => (
                <Button
                  key={item.type}
                  variant="outline"
                  size="sm"
                  onClick={() => addWidget(item.type as Widget['type'])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {item.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Widgets Grid */}
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', isTvMode && 'gap-6')}>
        {widgets.map(widget => (
          <Card
            key={widget.id}
            className={cn(
              getWidgetGridClass(widget.size),
              'transition-all duration-200',
              isEditMode && 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background'
            )}
          >
            <CardHeader className={cn('pb-2', isTvMode && 'pb-4')}>
              <CardTitle
                className={cn(
                  'flex items-center justify-between text-base',
                  isTvMode && 'text-xl'
                )}
              >
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  {widget.title}
                </div>
                {isEditMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWidget(widget.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>{renderWidget(widget)}</CardContent>
          </Card>
        ))}
      </div>

      {/* TV Mode Branding Footer */}
      {isTvMode && (
        <div className="fixed bottom-8 left-8 right-8 flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-green-500 animate-pulse" />
            <span className="text-lg font-semibold">PULSE</span>
          </div>
          <div className="text-sm">
            Auto-refresh: {refreshInterval}s | Press ESC to exit
          </div>
        </div>
      )}
    </div>
  );
}

// Status Card Component
function StatusCard({
  label,
  value,
  icon,
  color,
  tvMode,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'yellow' | 'blue';
  tvMode: boolean;
}) {
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/20 text-green-500',
    red: 'bg-red-500/10 border-red-500/20 text-red-500',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        colorClasses[color],
        tvMode && 'p-6'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={cn('text-sm', tvMode && 'text-base')}>{label}</span>
      </div>
      <div className={cn('text-3xl font-bold', tvMode && 'text-5xl')}>{value}</div>
    </div>
  );
}
