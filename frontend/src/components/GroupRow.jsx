import { kindById } from '../lib/categories';
import { timeAgo } from '../lib/dates';
import { Row } from './ui/Card';
import { BalanceStack } from './ui/Money';
import { Tile } from './ui/Tile';

export function GroupRow({ group, onClick, to }) {
  const kind = kindById(group.kind);
  return (
    <Row
      to={to}
      onClick={onClick}
      leading={<Tile icon={kind.icon} tone={kind.tone} />}
      title={group.name}
      subtitle={`${group.member_count} ${group.member_count === 1 ? 'member' : 'members'} · ${timeAgo(group.last_activity_at)}`}
      trailing={<BalanceStack paise={group.my_balance_paise} />}
    />
  );
}
