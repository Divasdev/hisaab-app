import { cn } from '../../lib/cn';

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** Kept for older callers. People are told apart by their initials and names, not by colour. */
export function toneFor() {
  return '';
}

const sizes = {
  xs: 'size-6 rounded-[5px] text-[10px]',
  sm: 'size-8 rounded-md text-[12px]',
  md: 'size-10 rounded-lg text-[14px]',
  lg: 'size-14 rounded-[10px] text-[19px]',
  xl: 'size-20 rounded-xl text-[27px]',
};

/**
 * A person's initials in a square plate. `me` fills it with ballpoint blue (that's you).
 * pending: this person was added by name and has not joined yet (dashed outline).
 */
export function Avatar({ user, size = 'md', short = false, pending, me = false, className }) {
  const isPending = pending ?? user?.joined === false;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-grid shrink-0 place-items-center pt-0.5 font-semibold select-none',
        me
          ? 'bg-accent text-accent-ink'
          : isPending
            ? 'border-[1.5px] border-dashed border-line-strong bg-surface text-ink-2'
            : 'border-[1.5px] border-line-strong bg-surface text-ink',
        sizes[size],
        className,
      )}
    >
      {short || size === 'xs' ? initials(user?.name).slice(0, 1) : initials(user?.name)}
    </span>
  );
}

export function AvatarStack({ users = [], max = 4, size = 'sm', className }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className={cn('flex items-center gap-1', className)}>
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} short />
      ))}
      {extra > 0 && <span className="pl-1 text-[13px] font-semibold text-ink-2">+{extra}</span>}
    </span>
  );
}
