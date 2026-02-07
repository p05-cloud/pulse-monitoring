import { useMemo } from 'react';

interface UptimeBarProps {
  checks: Array<{
    timestamp: string;
    success: boolean;
    responseTimeMs?: number;
  }>;
  className?: string;
}

export function UptimeBar({ checks, className = '' }: UptimeBarProps) {
  const bars = useMemo(() => {
    // Group checks into time buckets (e.g., hourly)
    // Display last 24 hours or last 100 checks
    const maxBars = 100;
    const barsToShow = checks.slice(-maxBars);

    return barsToShow.map((check, idx) => ({
      id: idx,
      success: check.success,
      timestamp: check.timestamp,
      responseTime: check.responseTimeMs,
    }));
  }, [checks]);

  const uptimePercentage = useMemo(() => {
    if (checks.length === 0) return 100;
    const successCount = checks.filter((c) => c.success).length;
    return Math.round((successCount / checks.length) * 100);
  }, [checks]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Uptime</span>
        <span className="font-semibold text-foreground">{uptimePercentage}%</span>
      </div>
      <div className="flex items-center gap-[2px] h-8">
        {bars.length === 0 ? (
          <div className="w-full h-full bg-muted rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
        ) : (
          bars.map((bar) => (
            <div
              key={bar.id}
              className={`flex-1 h-full rounded-sm transition-all hover:opacity-80 cursor-pointer group relative ${
                bar.success
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}
              title={`${bar.success ? 'Up' : 'Down'} - ${new Date(bar.timestamp).toLocaleString()}${
                bar.responseTime ? ` - ${bar.responseTime}ms` : ''
              }`}
            >
              {/* Tooltip on hover */}
              <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg whitespace-nowrap z-10 border">
                <div className="font-semibold">{bar.success ? '✓ Up' : '✗ Down'}</div>
                <div>{new Date(bar.timestamp).toLocaleString()}</div>
                {bar.responseTime && <div>{bar.responseTime}ms</div>}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{bars.length} checks</span>
        <span>Last {Math.floor(bars.length / 12)} hours</span>
      </div>
    </div>
  );
}
