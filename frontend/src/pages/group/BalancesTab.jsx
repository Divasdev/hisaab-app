import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { List, Row } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { BalanceStack } from '../../components/ui/Money';

/** Everyone's balance in the group. You first, then who is owed the most. */
export function BalancesTab({ group, people, meId }) {
  const members = [...group.members].sort((a, b) => (a.id === meId ? -1 : b.id === meId ? 1 : b.balance_paise - a.balance_paise));
  const allSettled = members.every((m) => m.balance_paise === 0);
  return (
    <div className="pt-4">
      {allSettled && (
        <EmptyState icon="checkCircle" tone="tone-2" title="Everyone is settled up" className="py-8">
          Nobody owes anything in this group right now.
        </EmptyState>
      )}
      <List>
        {members.map((m) => (
          <Row
            key={m.id}
            leading={<Avatar user={m} />}
            title={people.name(m.id)}
            subtitle={!m.joined ? 'Not joined yet' : m.role === 'admin' ? 'Admin' : m.upi_id || 'No UPI ID yet'}
            trailing={<BalanceStack paise={m.balance_paise} you={m.id === meId} />}
          />
        ))}
      </List>
      {!allSettled && (
        <Button variant="secondary" size="lg" full className="mt-4" to={`/groups/${group.id}/settle`}>
          See the fewest payments to settle
        </Button>
      )}
    </div>
  );
}
