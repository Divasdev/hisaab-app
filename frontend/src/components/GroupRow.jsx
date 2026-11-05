import { timeAgo } from '../lib/dates';
import { Row } from './ui/Card';
import { BalanceStack } from './ui/Money';

/**
 * A group on a line: name and when it was last used on the left, your balance on the right.
 * A settled group (money was spent, nothing is owed now) is struck through, like a paid line on paper.
 * A brand-new group with no expenses is not "settled": it says so instead.
 */
export function GroupRow({ group, onClick, to }) {
  const spent = group.total_spent_paise > 0;
  const settled = !group.my_balance_paise && spent;
  return (
    <Row
      to={to}
      onClick={onClick}
      title={settled ? <span className="struck text-ink-2">{group.name}</span> : group.name}
      subtitle={`${group.member_count} ${group.member_count === 1 ? 'member' : 'members'} · ${timeAgo(group.last_activity_at)}`}
      trailing={group.my_balance_paise || spent ? <BalanceStack paise={group.my_balance_paise} /> : <span className="shrink-0 text-[14px] text-ink-2">no expenses yet</span>}
    />
  );
}
