interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function Spinner({ size = 'md', color = 'border-primary', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`border-t-transparent rounded-full animate-spin ${sizeClasses[size]} ${color} ${className}`}
      role="status"
      aria-label="Đang tải"
    />
  );
}

interface FullscreenLoaderProps {
  message?: string;
}

export function FullscreenLoader({ message = 'Đang tải...' }: FullscreenLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#f8fafb]/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
      <div className="relative flex items-center justify-center mb-4">
        {/* Outer spinner */}
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        {/* Inner pulsing icon */}
        <div className="absolute text-3xl animate-pulse select-none">🌸</div>
      </div>
      <div className="text-sm font-bold text-primary tracking-wide animate-pulse">
        {message}
      </div>
    </div>
  );
}
