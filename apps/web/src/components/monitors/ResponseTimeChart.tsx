import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface ResponseTimeChartProps {
  data: Array<{
    timestamp: string;
    responseTimeMs: number | null;
    success: boolean;
  }>;
  height?: number;
}

export function ResponseTimeChart({ data, height = 280 }: ResponseTimeChartProps) {
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
    if (times.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };

    const sorted = [...times].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      min: Math.min(...times),
      max: Math.max(...times),
      p95: sorted[p95Index] || sorted[sorted.length - 1],
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No response time data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const isGood = value < stats.avg;
      const isBad = value > stats.p95;

      return (
        <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-1">{payload[0].payload.formattedTime}</p>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isBad ? 'bg-red-500' : isGood ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <p className="text-lg font-bold">{value}ms</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isBad ? 'Above P95' : isGood ? 'Below average' : 'Normal'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <span>Response Time</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row - Compact */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center space-x-1">
              <Minus className="h-3 w-3 text-muted-foreground" />
              <span className="text-lg font-bold">{stats.avg}ms</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Average</div>
          </div>
          <div className="text-center p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-center space-x-1">
              <TrendingDown className="h-3 w-3 text-green-600" />
              <span className="text-lg font-bold text-green-600">{stats.min}ms</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Minimum</div>
          </div>
          <div className="text-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="h-3 w-3 text-red-600" />
              <span className="text-lg font-bold text-red-600">{stats.max}ms</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Maximum</div>
          </div>
          <div className="text-center p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-lg font-bold text-orange-600">{stats.p95}ms</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">P95</div>
          </div>
        </div>

        {/* ECG-style Chart */}
        <div className="relative">
          {/* Animated ECG line effect overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className="ecg-scan-line" />
          </div>

          <ResponsiveContainer width="100%" height={height}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Primary gradient - ECG green/blue pulse */}
                <linearGradient id="ecgGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                {/* Glow effect for line */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid lines - subtle ECG paper effect */}
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(ts) => format(new Date(ts), 'HH:mm')}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                width={45}
                tickFormatter={(value) => `${value}ms`}
              />

              {/* Reference lines for context */}
              <ReferenceLine
                y={stats.avg}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={stats.p95}
                stroke="#f97316"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* ECG-style area fill */}
              <Area
                type="monotone"
                dataKey="responseTime"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#ecgGradient)"
                filter="url(#glow)"
                animationDuration={1500}
                animationEasing="ease-in-out"
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: '#22c55e',
                  strokeWidth: 2,
                  fill: 'hsl(var(--background))',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-8 h-0.5 bg-muted-foreground/50" style={{ borderTop: '2px dashed' }} />
            <span>Avg ({stats.avg}ms)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-8 h-0.5 bg-orange-500/50" style={{ borderTop: '2px dashed' }} />
            <span>P95 ({stats.p95}ms)</span>
          </div>
        </div>
      </CardContent>

      <style>{`
        @keyframes ecg-scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .ecg-scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(34, 197, 94, 0.1) 45%,
            rgba(34, 197, 94, 0.3) 50%,
            rgba(34, 197, 94, 0.1) 55%,
            transparent 100%
          );
          animation: ecg-scan 3s ease-in-out infinite;
        }
      `}</style>
    </Card>
  );
}
