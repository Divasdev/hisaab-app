import { cn } from '../../lib/cn';

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** Same name, same colour, everywhere (recognition over recall). Works for people who have not joined too. */
export function toneFor(name = '') {
  let h = 7;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `tone-${h % 8}`;
}

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-[12px]',
  md: 'size-10 text-[14px]',
  lg: 'size-14 text-[19px]',
  xl: 'size-20 text-[27px]',
};

/** pending: this person was added by name and has not joined yet (dashed outline). */
export function Avatar({ user, size = 'md', short = false, pending, className }) {
  const isPending = pending ?? user?.joined === false;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-semibold tracking-[0.02em] select-none',
        isPending ? 'border-[1.5px] border-dashed border-line-strong bg-surface text-ink-2' : 'bg-[var(--tone-bg)] text-[var(--tone-fg)]',
        toneFor(user?.name),
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
    <span className={cn('flex items-center', className)}>
      {shown.map((u, i) => (
        <Avatar key={u.id} user={u} size={size} short className={cn('ring-2 ring-[var(--bg)]', i > 0 && (size === 'xs' ? '-ml-1.5' : '-ml-2'))} />
      ))}
      {extra > 0 && (
        <span className={cn('-ml-2 inline-grid place-items-center rounded-full bg-sunken font-semibold text-ink-2 ring-2 ring-[var(--bg)]', sizes[size])}>+{extra}</span>
      )}
    </span>
  );
}
