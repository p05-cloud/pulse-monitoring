import { Circle } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN' | 'PAUSED';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

export function StatusIndicator({
  status,
  size = 'md',
  showLabel = true,
  animate = true,
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusConfig = {
    UP: {
      color: 'bg-green-500',
      textColor: 'text-green-600',
      label: 'Up',
      shouldPulse: true,
    },
    DOWN: {
      color: 'bg-red-500',
      textColor: 'text-red-600',
      label: 'Down',
      shouldPulse: true,
    },
    DEGRADED: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      label: 'Degraded',
      shouldPulse: false,
    },
    UNKNOWN: {
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      label: 'Unknown',
      shouldPulse: false,
    },
    PAUSED: {
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      label: 'Paused',
      shouldPulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring animation for UP/DOWN */}
        {animate && config.shouldPulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`}
          />
        )}
        {/* Status dot */}
        <span
          className={`relative inline-flex rounded-full ${config.color} ${sizeClasses[size]}`}
        />
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
