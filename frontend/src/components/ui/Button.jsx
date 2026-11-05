import { Link } from 'react-router';
import { cn } from '../../lib/cn';

// Press feedback starts on touch-down (active:scale), not on release.
const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.97] active:duration-75 disabled:pointer-events-none disabled:opacity-45';

const variants = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover shadow-[0_1px_0_rgb(255_255_255/0.12)_inset]',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-2',
  tinted: 'bg-accent-soft text-accent-text hover:bg-[color-mix(in_oklab,var(--accent-soft),var(--accent)_8%)]',
  danger: 'bg-owe-soft text-owe hover:bg-[color-mix(in_oklab,var(--owe-soft),var(--owe)_8%)]',
  ghost: 'text-ink-2 hover:bg-sunken hover:text-ink',
};

const sizes = {
  lg: 'h-[52px] rounded-[14px] px-5 text-[17px]',
  md: 'h-11 rounded-xl px-4 text-[15px]',
  sm: 'h-9 rounded-[10px] px-3 text-[14px]',
};

export function Spinner({ className }) {
  return <span aria-hidden="true" className={cn('inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent', className)} />;
}

export function Button({ variant = 'primary', size = 'md', full, loading, icon, to, className, children, disabled, type = 'button', ...rest }) {
  const cls = cn(base, variants[variant], sizes[size], full && 'w-full', className);
  const content = (
    <>
      {loading ? <Spinner /> : icon}
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
  const cls = cn(
    'grid size-10 shrink-0 place-items-center rounded-xl text-ink-2 transition-[transform,background-color,color] duration-150 hover:bg-sunken hover:text-ink active:scale-95',
    className,
  );
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
