import { cn } from '../../lib/cn';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Row } from '../../components/ui/Card';
import { BalanceStack } from '../../components/ui/Money';

/** Everyone's balance in the group. You first, then who is owed the most. */
export function BalancesTab({ group, people, meId }) {
  const members = [...group.members].sort((a, b) => (a.id === meId ? -1 : b.id === meId ? 1 : b.balance_paise - a.balance_paise));
  const allSettled = members.every((m) => m.balance_paise === 0);
  return (
    <div>
      {allSettled && (
        <div className="pt-6 pb-5">
          <h3 className="font-display text-[22px] leading-8">Everyone is settled up</h3>
          <p className="mt-1 text-[16px] leading-relaxed text-ink-2">Nobody owes anything in this group right now.</p>
        </div>
      )}
      {/* Right under the tabs, the tab line is the first rule; after the settled note, the list draws its own. */}
      <ul className={cn('divide-y divide-line border-b border-line', allSettled && 'border-t')}>
        {members.map((m) => (
          <Row
            key={m.id}
            leading={<Avatar user={m} me={m.id === meId} />}
            title={people.name(m.id)}
            subtitle={!m.joined ? 'Not joined yet' : m.role === 'admin' ? 'Admin' : m.upi_id || 'No UPI ID yet'}
            trailing={<BalanceStack paise={m.balance_paise} you={m.id === meId} />}
          />
        ))}
      </ul>
      {!allSettled && (
        <Button variant="secondary" size="md" full className="mt-6" to={`/groups/${group.id}/settle`}>
          See the fewest payments to settle
        </Button>
      )}
    </div>
  );
}
