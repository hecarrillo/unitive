// components/ui/status-pill.tsx
import { cn } from '@/lib/utils';

interface StatusPillProps {
  status: 'open' | 'closed' | 'unknown';
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const statusConfig = {
    open: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      dotColor: 'bg-green-500',
      text: 'Open'
    },
    closed: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      dotColor: 'bg-red-500',
      text: 'Closed'
    },
    unknown: {
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      dotColor: 'bg-gray-500',
      text: 'Unknown'
    }
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-1',
        config.dotColor
      )} />
      {config.text}
    </div>
  );
}