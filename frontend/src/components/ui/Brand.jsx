import { cn } from '../../lib/cn';
import { Icon } from '../Icon';

export function BrandMark({ size = 'md', className }) {
  const s = { sm: ['size-7 rounded-[9px]', 15], md: ['size-8 rounded-[10px]', 17], lg: ['size-14 rounded-[17px]', 28] }[size];
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center bg-accent text-white shadow-[0_1px_0_rgb(255_255_255/0.15)_inset]', s[0], className)}>
      <Icon name="rupee" size={s[1]} strokeWidth={2.2} />
    </span>
  );
}

export function Wordmark({ className }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <span className="text-[19px] font-bold tracking-[-0.025em]">Hisaab</span>
    </span>
  );
}
