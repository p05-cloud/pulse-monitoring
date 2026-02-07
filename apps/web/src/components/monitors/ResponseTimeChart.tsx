import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';

interface ResponseTimeChartProps {
  data: Array<{
    timestamp: string;
    responseTimeMs: number | null;
    success: boolean;
  }>;
  height?: number;
  showArea?: boolean;
}

export function ResponseTimeChart({ data, height = 300, showArea = true }: ResponseTimeChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.success && d.responseTimeMs !== null)
      .map((d) => ({
        timestamp: new Date(d.timestamp).getTime(),
        responseTime: d.responseTimeMs,
        formattedTime: format(new Date(d.timestamp), 'MMM dd HH:mm'),
      }));
  }, [data]);

  const stats = useMemo(() => {
    const times = chartData.map((d) => d.responseTime).filter((t) => t !== null) as number[];
    if (times.length === 0) return { avg: 0, min: 0, max: 0 };

    return {
      avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      min: Math.min(...times),
      max: Math.max(...times),
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No response time data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.formattedTime}</p>
          <p className="text-sm text-muted-foreground">
            Response: <span className="font-semibold text-foreground">{payload[0].value}ms</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-foreground">{stats.avg}ms</div>
          <div className="text-xs text-muted-foreground">Average</div>
        </div>
        <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="text-2xl font-bold text-green-600">{stats.min}ms</div>
          <div className="text-xs text-muted-foreground">Minimum</div>
        </div>
        <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="text-2xl font-bold text-red-600">{stats.max}ms</div>
          <div className="text-xs text-muted-foreground">Maximum</div>
        </div>
      </div>

      {/* Chart */}
      <div className="border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-semibold mb-4">Response Time</h3>
        <ResponsiveContainer width="100%" height={height}>
          {showArea ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorResponseTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(ts) => format(new Date(ts), 'HH:mm')}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="responseTime"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorResponseTime)"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(ts) => format(new Date(ts), 'HH:mm')}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
