import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
} as const;

export interface LoadingSpinnerProps {
  size?: keyof typeof sizeMap;
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2" role="status" aria-live="polite">
      <Loader2 className={cn('text-muted-foreground animate-spin', sizeMap[size], className)} />
      {label ? (
        <span className="text-muted-foreground text-sm">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}
