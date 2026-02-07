import { cn } from '@/lib/utils';

interface ECGLoaderProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ECGLoader({ text = 'Loading...', className, size = 'md' }: ECGLoaderProps) {
  const sizes = {
    sm: { width: 80, height: 40, strokeWidth: 2 },
    md: { width: 120, height: 60, strokeWidth: 2.5 },
    lg: { width: 200, height: 100, strokeWidth: 3 },
  };

  const { width, height, strokeWidth } = sizes[size];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 100"
        className="ecg-loader"
      >
        <defs>
          <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background grid lines */}
        <g stroke="#22c55e" strokeOpacity="0.1" strokeWidth="0.5">
          {[20, 40, 60, 80].map((y) => (
            <line key={y} x1="0" y1={y} x2="200" y2={y} />
          ))}
          {[40, 80, 120, 160].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="100" />
          ))}
        </g>

        {/* ECG Line */}
        <path
          d="M0,50 L30,50 L35,50 L40,50 L45,30 L50,70 L55,20 L60,80 L65,50 L70,50 L100,50 L105,50 L110,50 L115,30 L120,70 L125,20 L130,80 L135,50 L140,50 L170,50 L175,50 L180,50 L185,30 L190,70 L195,20 L200,80"
          fill="none"
          stroke="url(#ecgGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          className="ecg-path"
        />

        {/* Scanning line */}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="100"
          stroke="#22c55e"
          strokeWidth="2"
          strokeOpacity="0.6"
          className="ecg-scan-line"
        />
      </svg>

      {text && (
        <p className={cn(
          'text-muted-foreground animate-pulse',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg'
        )}>
          {text}
        </p>
      )}

      <style>{`
        .ecg-path {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: ecg-draw 1.5s ease-in-out infinite;
        }

        .ecg-scan-line {
          animation: ecg-scan 1.5s linear infinite;
        }

        @keyframes ecg-draw {
          0% {
            stroke-dashoffset: 400;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -400;
          }
        }

        @keyframes ecg-scan {
          0% {
            transform: translateX(0);
            opacity: 0.8;
          }
          100% {
            transform: translateX(200px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
