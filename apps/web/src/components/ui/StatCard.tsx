import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

const variantStyles = {
  default: {
    gradient: 'from-primary/5 via-primary/10 to-primary/5',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    valueColor: 'text-foreground',
  },
  success: {
    gradient: 'from-green-500/5 via-green-500/10 to-emerald-500/5',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-600',
    valueColor: 'text-green-600',
  },
  warning: {
    gradient: 'from-yellow-500/5 via-amber-500/10 to-orange-500/5',
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-600',
    valueColor: 'text-yellow-600',
  },
  danger: {
    gradient: 'from-red-500/5 via-red-500/10 to-rose-500/5',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600',
    valueColor: 'text-red-600',
  },
  info: {
    gradient: 'from-blue-500/5 via-blue-500/10 to-indigo-500/5',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    valueColor: 'text-blue-600',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  onClick,
  className,
  children,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'stat-card group cursor-pointer',
        onClick && 'hover:border-primary/30',
        className
      )}
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          'stat-card-gradient bg-gradient-to-br',
          styles.gradient
        )}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          {Icon && (
            <div className={cn('p-2 rounded-lg transition-colors', styles.iconBg)}>
              <Icon className={cn('h-4 w-4', styles.iconColor)} />
            </div>
          )}
        </div>

        <div className={cn('text-3xl font-bold tracking-tight', styles.valueColor)}>
          {value}
        </div>

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}

        {trend && (
          <div className="flex items-center mt-3 text-xs">
            <span
              className={cn(
                'font-medium',
                trend.value >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
