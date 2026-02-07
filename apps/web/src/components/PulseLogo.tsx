export function PulseLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 100 100"
        className="text-primary"
      >
        {/* ECG line animation */}
        <path
          d="M 0,50 L 20,50 L 25,50 L 30,20 L 35,80 L 40,35 L 45,65 L 50,50 L 100,50"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse-line"
        />
      </svg>
      <style>{`
        @keyframes pulse-draw {
          0% {
            stroke-dashoffset: 200;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -200;
          }
        }

        .animate-pulse-line {
          stroke-dasharray: 200;
          animation: pulse-draw 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
