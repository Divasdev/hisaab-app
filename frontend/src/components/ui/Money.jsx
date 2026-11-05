import { cn } from '../../lib/cn';
import { formatINR } from '../../lib/money';
import { Icon } from '../Icon';

export function Money({ paise, className }) {
  return <span className={cn('tabular-nums', className)}>{formatINR(paise)}</span>;
}

/**
 * Money direction is never shown by colour alone: there is always a word ("you owe" / "you get back")
 * and an arrow, plus the colour.
 * paise > 0 = money comes back to this person, paise < 0 = this person has to pay.
 */
export function balanceInfo(paise, you = true) {
  if (paise > 0) return { label: you ? 'you get back' : 'gets back', tone: 'text-owed', icon: 'arrowDownLeft' };
  if (paise < 0) return { label: you ? 'you owe' : 'owes', tone: 'text-owe', icon: 'arrowUpRight' };
  return { label: 'settled up', tone: 'text-ink-3', icon: null };
}

/** Two-line balance used on the right side of rows. */
export function BalanceStack({ paise, you = true, className }) {
  const b = balanceInfo(paise, you);
  if (!paise) return <span className={cn('text-[13.5px] text-ink-3', className)}>settled up</span>;
  return (
    <span className={cn('flex flex-col items-end leading-tight', b.tone, className)}>
      <span className="flex items-center gap-0.5 text-[12.5px] font-medium">
        <Icon name={b.icon} size={13} strokeWidth={2.2} />
        {b.label}
      </span>
      <span className="text-[16px] font-semibold tabular-nums">{formatINR(paise)}</span>
    </span>
  );
}

/** One-line version for tight spaces (sidebar). */
export function BalanceInline({ paise, className }) {
  if (!paise) return <span className={cn('text-[12.5px] text-ink-3', className)}>settled</span>;
  const owe = paise < 0;
  return (
    <span className={cn('text-[12.5px] font-medium whitespace-nowrap tabular-nums', owe ? 'text-owe' : 'text-owed', className)}>
      {owe ? 'owe ' : 'get '}
      {formatINR(paise)}
    </span>
  );
}
