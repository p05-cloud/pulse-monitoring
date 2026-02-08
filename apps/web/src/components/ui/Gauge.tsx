import { useEffect, useState, useId } from 'react';

interface GaugeProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showValue?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 80, height: 50, strokeWidth: 6, fontSize: 12, labelSize: 8 },
  md: { width: 120, height: 75, strokeWidth: 8, fontSize: 16, labelSize: 10 },
  lg: { width: 160, height: 100, strokeWidth: 10, fontSize: 20, labelSize: 12 },
};

export function Gauge({
  value,
  size = 'md',
  label,
  showValue = true,
  animated = true,
  className = ''
}: GaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const uniqueId = useId(); // Unique ID for each gauge instance
  const config = sizeConfig[size];

  // Animate the value on mount and when value changes
  useEffect(() => {
    if (!animated) {
      setAnimatedValue(value);
      return;
    }

    const duration = 1000; // 1 second animation
    const startTime = Date.now();
    const startValue = animatedValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (value - startValue) * easeOutQuart;

      setAnimatedValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, animated]);

  // Calculate the arc
  const centerX = config.width / 2;
  const centerY = config.height;
  const radius = config.width / 2 - config.strokeWidth;

  // Arc goes from -180 to 0 degrees (bottom half of circle)
  const startAngle = -180;
  const endAngle = 0;
  const valueAngle = startAngle + (animatedValue / 100) * (endAngle - startAngle);

  // Convert angle to radians and calculate points
  const toRadians = (angle: number) => (angle * Math.PI) / 180;

  const startX = centerX + radius * Math.cos(toRadians(startAngle));
  const startY = centerY + radius * Math.sin(toRadians(startAngle));
  const endX = centerX + radius * Math.cos(toRadians(endAngle));
  const endY = centerY + radius * Math.sin(toRadians(endAngle));
  const valueX = centerX + radius * Math.cos(toRadians(valueAngle));
  const valueY = centerY + radius * Math.sin(toRadians(valueAngle));

  // Background arc path
  const bgArcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  // Value arc path
  const largeArcFlag = animatedValue > 50 ? 1 : 0;
  const valueArcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${valueX} ${valueY}`;

  // Color based on value
  const getColor = (val: number) => {
    if (val >= 99.9) return { stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' }; // green
    if (val >= 99) return { stroke: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' }; // yellow
    if (val >= 95) return { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' }; // orange
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' }; // red
  };

  const colors = getColor(animatedValue);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={config.width}
        height={config.height + 10}
        viewBox={`0 0 ${config.width} ${config.height + 10}`}
      >
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id={`gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={bgArcPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          className="text-muted/30"
        />

        {/* Value arc with glow */}
        <path
          d={valueArcPath}
          fill="none"
          stroke={`url(#gradient-${uniqueId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          filter={`url(#glow-${uniqueId})`}
          style={{
            transition: animated ? 'none' : 'stroke-dashoffset 0.5s ease-out',
          }}
        />

        {/* Needle indicator */}
        <circle
          cx={valueX}
          cy={valueY}
          r={config.strokeWidth / 2 + 2}
          fill={colors.stroke}
          filter={`url(#glow-${uniqueId})`}
        />

        {/* Value text */}
        {showValue && (
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            className="fill-foreground font-bold"
            style={{ fontSize: config.fontSize }}
          >
            {animatedValue.toFixed(1)}%
          </text>
        )}
      </svg>

      {/* Label */}
      {label && (
        <span
          className="text-muted-foreground text-center mt-1"
          style={{ fontSize: config.labelSize }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// Grid layout for multiple gauges
interface GaugeGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function GaugeGrid({ children, columns = 4, className = '' }: GaugeGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-3 md:grid-cols-6',
  };

  return (
    <div className={`grid gap-4 ${gridCols[columns]} ${className}`}>
      {children}
    </div>
  );
}
