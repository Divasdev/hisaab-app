import { cn } from '../../lib/cn';
import { Tile } from './Tile';

export function EmptyState({ icon = 'receipt', tone = 'tone-accent', title, children, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <Tile icon={icon} tone={tone} size="lg" />
      <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.01em]">{title}</h3>
      {children && <p className="mt-1.5 max-w-[36ch] text-[15px] leading-relaxed text-ink-2">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
