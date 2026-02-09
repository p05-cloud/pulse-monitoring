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
  Building2,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PulseLogo } from '@/components/PulseLogo';
import { Gauge } from '@/components/ui/Gauge';
import api from '@/lib/api';

interface Widget {
  id: string;
  type: 'status-overview' | 'incident-list' | 'uptime-chart' | 'response-time' | 'project-health' | 'sla-status' | 'gauge-panel' | 'aggregator-panel' | 'monitor-list';
  title: string;
  size: 'small' | 'medium' | 'large';
  projectId?: string;
}

interface MonitorStatus {
  id: string;
  name: string;
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'MAINTENANCE' | 'UNKNOWN';
  responseTime: number;
  uptime: number;
  projectId?: string;
  projectName?: string;
  monitorType?: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

const defaultWidgets: Widget[] = [
  { id: '1', type: 'status-overview', title: 'Status Overview', size: 'large' },
  { id: '2', type: 'incident-list', title: 'Active Incidents', size: 'medium' },
  { id: '3', type: 'uptime-chart', title: 'Uptime (24h)', size: 'medium' },
  { id: '4', type: 'response-time', title: 'Response Times', size: 'small' },
];

const WIDGETS_STORAGE_KEY = 'tv-dashboard-widgets';

const loadWidgetsFromStorage = (): Widget[] => {
  try {
    const stored = localStorage.getItem(WIDGETS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load widgets from storage:', e);
  }
  return defaultWidgets;
};

export default function CustomDashboard() {
  const [widgets, setWidgets] = useState<Widget[]>(loadWidgetsFromStorage);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTvMode, setIsTvMode] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [monitors, setMonitors] = useState<MonitorStatus[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      // Fetch monitors with limit=500 to get all
      const response = await api.get('/monitors?limit=500');
      if (response.data?.data) {
        setMonitors(
          response.data.data.map((m: any) => ({
            id: m.id,
            name: m.name,
            status: m.currentStatus || m.status || 'UNKNOWN',
            responseTime: m.lastResponseTimeMs || m.lastResponseTime || 0,
            uptime: m.uptimePercentage ?? (m.currentStatus === 'UP' ? 99.9 : m.currentStatus === 'DOWN' ? 0 : 95),
            projectId: m.projectId || m.project?.id,
            projectName: m.project?.name,
            monitorType: m.monitorType,
          }))
        );
      }

      // Fetch projects
      const projectsRes = await api.get('/projects');
      if (projectsRes.data?.data) {
        setProjects(projectsRes.data.data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  }, []);

  // Filter monitors based on selected project
  const filteredMonitors = selectedProjectId === 'all'
    ? monitors
    : monitors.filter(m => m.projectId === selectedProjectId);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // Save widgets to localStorage when they change
  useEffect(() => {
    localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

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

  const resizeWidget = (id: string, newSize: Widget['size']) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, size: newSize } : w));
  };

  const cycleSizeUp = (id: string) => {
    const sizes: Widget['size'][] = ['small', 'medium', 'large'];
    setWidgets(widgets.map(w => {
      if (w.id !== id) return w;
      const currentIndex = sizes.indexOf(w.size);
      const nextIndex = (currentIndex + 1) % sizes.length;
      return { ...w, size: sizes[nextIndex] };
    }));
  };

  const resetToDefault = () => {
    setWidgets(defaultWidgets);
  };

  const getStatusCounts = () => {
    const counts = { up: 0, down: 0, degraded: 0, maintenance: 0 };
    filteredMonitors.forEach(m => {
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
        const downMonitors = filteredMonitors.filter(m => m.status === 'DOWN' || m.status === 'DEGRADED');
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
            {filteredMonitors.slice(0, 6).map(m => (
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
          filteredMonitors.length > 0
            ? filteredMonitors.reduce((acc, m) => acc + m.responseTime, 0) / filteredMonitors.length
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
            {filteredMonitors.slice(0, 4).map(m => (
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
          filteredMonitors.length > 0
            ? filteredMonitors.reduce((acc, m) => acc + m.uptime, 0) / filteredMonitors.length
            : 100;
        const slaTarget = 99.9;
        const slaStatus = overallUptime >= slaTarget ? 'MEETING' : 'BREACHING';
        return (
          <div className="flex flex-col items-center py-4">
            <Gauge
              value={overallUptime}
              size={isTvMode ? 'lg' : 'md'}
              animated={true}
            />
            <p className={cn('text-muted-foreground mt-4', isTvMode && 'text-lg')}>
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

      case 'gauge-panel':
        return (
          <div className={cn('grid gap-4', isTvMode ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4')}>
            {filteredMonitors.slice(0, isTvMode ? 12 : 8).map(m => (
              <div
                key={m.id}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Gauge
                  value={m.uptime}
                  size={isTvMode ? 'md' : 'sm'}
                  animated={true}
                />
                <span className={cn('text-xs text-center mt-2 line-clamp-2', isTvMode && 'text-sm')}>
                  {m.name}
                </span>
                <span
                  className={cn(
                    'text-xs mt-1 px-2 py-0.5 rounded-full',
                    m.status === 'UP' ? 'bg-green-500/10 text-green-500' :
                    m.status === 'DOWN' ? 'bg-red-500/10 text-red-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  )}
                >
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        );

      case 'aggregator-panel':
        const aggregators = filteredMonitors.filter(m => m.monitorType === 'AGGREGATOR');
        return (
          <div className="space-y-3">
            {aggregators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No aggregator monitors found</p>
              </div>
            ) : (
              aggregators.map(m => (
                <div
                  key={m.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    m.status === 'UP' ? 'border-green-500/20 bg-green-500/5' :
                    m.status === 'DOWN' ? 'border-red-500/20 bg-red-500/5' :
                    'border-yellow-500/20 bg-yellow-500/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full',
                        m.status === 'UP' ? 'bg-green-500' :
                        m.status === 'DOWN' ? 'bg-red-500 animate-pulse' :
                        'bg-yellow-500'
                      )}
                    />
                    <div>
                      <span className={cn('font-medium', isTvMode && 'text-lg')}>{m.name}</span>
                      {m.projectName && (
                        <span className="text-xs text-muted-foreground ml-2">{m.projectName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn('text-sm', isTvMode && 'text-base')}>
                      {m.responseTime > 0 ? `${m.responseTime}ms` : '-'}
                    </span>
                    <Gauge value={m.uptime} size="sm" animated={true} />
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'monitor-list':
        return (
          <div className={cn('grid gap-2', isTvMode ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2')}>
            {filteredMonitors.slice(0, isTvMode ? 16 : 8).map(m => (
              <div
                key={m.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  m.status === 'UP' ? 'border-green-500/20 bg-green-500/5' :
                  m.status === 'DOWN' ? 'border-red-500/20 bg-red-500/5' :
                  'border-yellow-500/20 bg-yellow-500/5'
                )}
              >
                <div
                  className={cn(
                    'h-3 w-3 rounded-full flex-shrink-0',
                    m.status === 'UP' ? 'bg-green-500' :
                    m.status === 'DOWN' ? 'bg-red-500 animate-pulse' :
                    'bg-yellow-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className={cn('font-medium text-sm truncate block', isTvMode && 'text-base')}>
                    {m.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {m.responseTime > 0 ? `${m.responseTime}ms` : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const getWidgetGridClass = (size: Widget['size']) => {
    if (isTvMode) {
      // TV mode: larger grid for bigger screens
      switch (size) {
        case 'small':
          return 'col-span-1';
        case 'medium':
          return 'col-span-2';
        case 'large':
          return 'col-span-4';
      }
    }
    // Normal mode
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
      <div className={cn('flex items-center justify-between', isTvMode && 'mb-4')}>
        <div className="flex items-center gap-4">
          {isTvMode && (
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Company" className="h-8 w-auto" />
              <PulseLogo />
            </div>
          )}
          <div>
            {!isTvMode && (
              <h1 className="text-2xl font-bold">TV Dashboard</h1>
            )}
            <p className={cn('text-muted-foreground', isTvMode && 'text-base')}>
              {selectedProjectId !== 'all' && (
                <span className="text-primary font-semibold mr-2">
                  {projects.find(p => p.id === selectedProjectId)?.name || 'Selected Client'}
                </span>
              )}
              {selectedProjectId !== 'all' ? '•' : ''} {lastUpdate.toLocaleTimeString()}
              {isTvMode && filteredMonitors.length > 0 && (
                <span className="ml-2 text-xs">• {filteredMonitors.length} monitors</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Project Filter - shown in both modes */}
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className={cn('w-40', isTvMode && 'w-48')}>
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                { type: 'gauge-panel', label: 'Gauge Panel' },
                { type: 'aggregator-panel', label: 'Aggregators' },
                { type: 'monitor-list', label: 'Monitor List' },
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
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefault}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset to Default
              </Button>
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
                  {isEditMode && (
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  )}
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  {widget.title}
                </div>
                {isEditMode && (
                  <div className="flex items-center gap-1">
                    {/* Size selector */}
                    <Select
                      value={widget.size}
                      onValueChange={(value: Widget['size']) => resizeWidget(widget.id, value)}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWidget(widget.id)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>{renderWidget(widget)}</CardContent>
          </Card>
        ))}
      </div>

      {/* TV Mode Footer */}
      {isTvMode && (
        <div className="fixed bottom-4 left-6 right-6 flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-2">
            <PulseLogo />
            <span className="text-sm font-medium">PULSE</span>
          </div>
          <div className="text-xs">
            Auto-refresh: {refreshInterval}s | Press ESC to exit
          </div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ACC" className="h-6 w-auto opacity-70" />
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
