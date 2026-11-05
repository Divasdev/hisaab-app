import { cn } from '../../lib/cn';

/**
 * A small word tag ("Food", "Trip"). Replaces the old coloured icon squares: this design names things
 * instead of drawing them. Pass `label`; without one nothing is drawn, so leftover icon-only calls vanish.
 */
// eslint-disable-next-line no-unused-vars
export function Tile({ label, icon, tone, size, className }) {
  if (!label) return null;
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center rounded-[5px] border border-line-strong px-1.5 pt-0.5 text-[12px] font-semibold text-ink-2', className)}>
      {label}
    </span>
  );
}
