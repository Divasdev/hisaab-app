import { cn } from '../../lib/cn';
import { List } from './Card';

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded bg-sunken', className)} />;
}

/** Placeholder rows shaped like the real ones: name and meta on the left, a figure on the right. */
export function ListSkeleton({ rows = 4, className }) {
  return (
    <List className={className} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-1 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
        </li>
      ))}
    </List>
  );
}
