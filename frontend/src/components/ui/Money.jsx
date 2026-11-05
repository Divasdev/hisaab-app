import { cn } from '../../lib/cn';
import { formatINR } from '../../lib/money';

export function Money({ paise, className }) {
  return <span className={cn('tabular', className)}>{formatINR(paise)}</span>;
}

/**
 * Money direction is never shown by colour alone: there is always a word ("you owe" / "you get back").
 * paise > 0 = money comes back to this person, paise < 0 = this person has to pay.
 */
export function balanceInfo(paise, you = true) {
  if (paise > 0) return { label: you ? 'you get back' : 'gets back', tone: 'text-owed' };
  if (paise < 0) return { label: you ? 'you owe' : 'owes', tone: 'text-owe' };
  return { label: 'settled', tone: 'text-ink-2' };
}

/** Two-line balance on the right side of rows: the word over the amount. Settled amounts are struck through. */
export function BalanceStack({ paise, you = true, className }) {
  const b = balanceInfo(paise, you);
  return (
    <span className={cn('flex shrink-0 flex-col items-end text-right', b.tone, className)}>
      <span className="text-[13px] leading-[18px] font-semibold">{b.label}</span>
      <span className={cn('tabular text-[20px] leading-[26px] font-bold', !paise && 'struck')}>{formatINR(paise, { exact: true })}</span>
    </span>
  );
}

/** One-line version for tight spaces (sidebar). */
export function BalanceInline({ paise, className }) {
  if (!paise) return <span className={cn('text-[13px] text-ink-2', className)}>settled</span>;
  const owe = paise < 0;
  return (
    <span className={cn('tabular text-[13px] font-semibold whitespace-nowrap', owe ? 'text-owe' : 'text-owed', className)}>
      {owe ? 'owe ' : 'get '}
      {formatINR(paise, { exact: true })}
    </span>
  );
}

/**
 * The big total: a direction line in red or green, then the figure in Martel, ballpoint blue,
 * double-underlined like a total at the bottom of a page.
 * `lead` replaces the direction line's wording when the screen needs its own ("You owe, overall").
 */
export function BigTotal({ paise, lead, settledText = 'All settled', className, size = 'lg' }) {
  const owe = paise < 0;
  const tone = paise > 0 ? 'text-owed' : owe ? 'text-owe' : 'text-ink-2';
  const line = lead ?? (paise > 0 ? 'You get back' : owe ? 'You owe' : 'Nothing owed');
  return (
    <div className={className}>
      <p className={cn('text-[16px] leading-[22px] font-semibold', tone)}>{line}</p>
      <p
        className={cn(
          'tabular mt-1.5 font-display leading-[1.15] break-words text-accent-text',
          size === 'lg' ? 'text-[44px] min-[380px]:text-[52px]' : 'text-[36px]',
          paise ? 'double-underline' : '',
        )}
      >
        {paise ? formatINR(paise) : settledText}
      </p>
    </div>
  );
}
