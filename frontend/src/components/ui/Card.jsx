import { Link } from 'react-router';
import { cn } from '../../lib/cn';
import { Icon } from '../Icon';

export function Card({ as: Tag = 'div', className, ...rest }) {
  return <Tag className={cn('rounded-2xl border border-line bg-surface', className)} {...rest} />;
}

/** A list inside a card: thin dividers, rounded corners kept on hover. */
export function List({ className, ...rest }) {
  return <Card as="ul" className={cn('divide-y divide-line overflow-hidden', className)} {...rest} />;
}

export function SectionHeader({ title, action, className, id }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-1 pt-7 pb-2.5', className)}>
      <h2 id={id} className="text-[17px] font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function Row({ to, onClick, leading, title, subtitle, trailing, chevron, className, as: Tag = 'li', ...rest }) {
  const inner = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-medium">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[13.5px] text-ink-2">{subtitle}</span>}
      </span>
      {trailing}
      {chevron && <Icon name="chevronRight" size={18} className="-mr-1 shrink-0 text-ink-3" />}
    </>
  );
  const cls = cn(
    'flex w-full items-center gap-3 px-4 py-3 text-left',
    (to || onClick) && 'transition-colors duration-150 hover:bg-surface-2 active:bg-sunken',
    className,
  );
  return (
    <Tag>
      {to ? (
        <Link to={to} className={cls} {...rest}>
          {inner}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={cls} {...rest}>
          {inner}
        </button>
      ) : (
        <div className={cls} {...rest}>
          {inner}
        </div>
      )}
    </Tag>
  );
}
