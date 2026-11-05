import { Link } from 'react-router';
import { cn } from '../../lib/cn';

// No hover animation and no shrinking on tap: a button changes colour while pressed, that is all.
// Hind sits a little high in its box, so labels get 2px of top padding to look centred.
const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap pt-0.5 font-semibold disabled:pointer-events-none disabled:opacity-45';

const variants = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover active:bg-accent-hover',
  secondary: 'border-[1.5px] border-accent-text bg-surface text-accent-text hover:bg-accent-soft active:bg-accent-soft',
  // Older screens ask for "tinted"; in this design it is the same outlined blue button.
  tinted: 'border-[1.5px] border-accent-text bg-surface text-accent-text hover:bg-accent-soft active:bg-accent-soft',
  danger: 'border-[1.5px] border-owe bg-surface text-owe hover:bg-owe-soft active:bg-owe-soft',
  ghost: 'text-ink-2 hover:bg-sunken hover:text-ink active:bg-sunken',
  quiet: 'text-accent-text underline decoration-[1.5px] underline-offset-4 hover:bg-accent-soft active:bg-accent-soft',
};

const sizes = {
  lg: 'h-14 rounded-xl px-5 text-[18px]',
  md: 'h-12 rounded-[10px] px-4 text-[16px]',
  sm: 'h-10 rounded-lg px-3.5 text-[15px]',
};

export function Spinner({ className }) {
  return <span aria-hidden="true" className={cn('inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent', className)} />;
}

export function Button({ variant = 'primary', size = 'md', full, loading, icon, to, className, children, disabled, type = 'button', ...rest }) {
  const cls = cn(base, variants[variant], sizes[size], full && 'w-full', className);
  const content = (
    <>
      {loading ? <Spinner className="-mt-0.5" /> : icon && <span className="-mt-0.5 flex">{icon}</span>}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}

/** Square icon-only button. Always pass `label` for screen readers. */
export function IconButton({ label, to, className, children, ...rest }) {
  const cls = cn('grid size-11 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-sunken hover:text-ink active:bg-sunken', className);
  if (to) {
    return (
      <Link to={to} aria-label={label} title={label} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} title={label} className={cls} {...rest}>
      {children}
    </button>
  );
}
