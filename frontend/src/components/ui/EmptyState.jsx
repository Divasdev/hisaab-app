import { cn } from '../../lib/cn';

/**
 * Nothing here yet. A heading, one sentence on what to do, and the button that does it.
 * (`icon` and `tone` are accepted from older screens and ignored: this design uses words, not pictures.)
 */
// eslint-disable-next-line no-unused-vars
export function EmptyState({ icon, tone, title, children, action, className }) {
  return (
    <div className={cn('border-y border-line py-10', className)}>
      <h3 className="font-display text-[22px] leading-8">{title}</h3>
      {children && <p className="mt-2 max-w-[42ch] text-[16px] leading-relaxed text-ink-2">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
