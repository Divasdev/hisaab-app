import { cn } from '../../lib/cn';
import { Icon } from '../Icon';

const sizes = {
  xs: ['size-7 rounded-lg', 15],
  sm: ['size-9 rounded-[10px]', 18],
  md: ['size-11 rounded-xl', 21],
  lg: ['size-14 rounded-2xl', 26],
};

/** A soft coloured square with an icon: categories, group kinds, activity types. */
export function Tile({ icon, tone = 'tone-n', size = 'md', className }) {
  const [box, px] = sizes[size];
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center bg-[var(--tone-bg)] text-[var(--tone-fg)]', tone, box, className)}>
      <Icon name={icon} size={px} />
    </span>
  );
}
