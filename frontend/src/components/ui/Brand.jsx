import { cn } from '../../lib/cn';

/** The mark: a ballpoint-blue square with the rupee sign set in Martel. */
export function BrandMark({ size = 'md', className }) {
  const s = { sm: 'size-7 rounded-md text-[17px]', md: 'size-8 rounded-md text-[19px]', lg: 'size-14 rounded-[10px] text-[34px]' }[size];
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center bg-accent pt-1 font-display text-accent-ink', s, className)}>
      ₹
    </span>
  );
}

/** "Hisaab" in Martel, the way a name is written at the top of a page. */
export function Wordmark({ className }) {
  return <span className={cn('font-display text-[22px] leading-none text-ink', className)}>Hisaab</span>;
}
