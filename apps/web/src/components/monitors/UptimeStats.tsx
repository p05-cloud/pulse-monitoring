interface UptimeStatsProps {
  stats: {
    last24h: number;
    last7d: number;
    last30d: number;
    last365d?: number;
  };
  incidents?: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

export function UptimeStats({ stats, incidents }: UptimeStatsProps) {
  const periods = [
    { label: 'Last 24 hours', uptime: stats.last24h, incidents: incidents?.last24h ?? 0 },
    { label: 'Last 7 days', uptime: stats.last7d, incidents: incidents?.last7d ?? 0 },
    { label: 'Last 30 days', uptime: stats.last30d, incidents: incidents?.last30d ?? 0 },
  ];

  if (stats.last365d !== undefined) {
    periods.push({
      label: 'Last 365 days',
      uptime: stats.last365d,
      incidents: 0,
    });
  }

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.9) return 'text-green-600';
    if (uptime >= 99) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUptimeBackground = (uptime: number) => {
    if (uptime >= 99.9) return 'bg-green-500/10 border-green-500/20';
    if (uptime >= 99) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {periods.map((period) => (
        <div
          key={period.label}
          className={`p-4 rounded-lg border ${getUptimeBackground(period.uptime)}`}
        >
          <div className="text-sm text-muted-foreground mb-1">{period.label}</div>
          <div className={`text-3xl font-bold ${getUptimeColor(period.uptime)}`}>
            {period.uptime.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {period.incidents} incident{period.incidents !== 1 ? 's' : ''}, 0m down
          </div>
        </div>
      ))}
    </div>
  );
}
