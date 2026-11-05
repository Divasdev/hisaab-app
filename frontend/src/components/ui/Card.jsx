import { Link } from 'react-router';
import { cn } from '../../lib/cn';
import { Icon } from '../Icon';

/** A block ruled off between two hairlines (used sparingly: invites, notes). Never a rounded box. */
export function Card({ as: Tag = 'div', className, ...rest }) {
  return <Tag className={cn('border-y border-line px-1 py-4', className)} {...rest} />;
}

/** A list is rows on hairline rules, like lines on a page. No box around it. */
export function List({ as: Tag = 'ul', className, ...rest }) {
  return <Tag className={cn('divide-y divide-line border-y border-line', className)} {...rest} />;
}

export function SectionHeader({ title, action, className, id }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 pt-8 pb-3', className)}>
      <h2 id={id} className="pt-0.5 text-[20px] leading-tight font-bold">
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
        <span className="block truncate text-[17px] leading-6 font-semibold">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[14px] leading-5 text-ink-2">{subtitle}</span>}
      </span>
      {trailing}
      {chevron && <Icon name="chevronRight" size={18} className="shrink-0 text-ink-3" />}
    </>
  );
  const cls = cn('flex w-full items-center gap-3 px-1 py-3.5 text-left', (to || onClick) && 'hover:bg-surface-2 active:bg-sunken', className);
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
