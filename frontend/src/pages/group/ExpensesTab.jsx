import { useState } from 'react';
import { categoryById } from '../../lib/categories';
import { dayLabel, toISODate } from '../../lib/dates';
import { formatINR } from '../../lib/money';
import { cn } from '../../lib/cn';
import { List, Row } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Tile } from '../../components/ui/Tile';
import { PaymentSheet } from './PaymentSheet';

/** Expenses and payments together, newest first, grouped by day. */
export function ExpensesTab({ groupId, expenses, payments, people, meId }) {
  const [openPayment, setOpenPayment] = useState(null);

  if (!expenses || !payments) return <ListSkeleton rows={5} className="mt-4" />;

  const items = [
    ...expenses.map((e) => ({ type: 'expense', day: e.date, at: e.created_at, e })),
    ...payments.map((p) => ({ type: 'payment', day: toISODate(new Date(p.created_at)), at: p.created_at, p })),
  ].sort((a, b) => b.day.localeCompare(a.day) || b.at.localeCompare(a.at));

  if (!items.length) {
    return (
      <EmptyState icon="receipt" title="No expenses yet">
        Add the first one, like the Wi-Fi bill or tonight&apos;s dinner. Everyone in the group will see it.
      </EmptyState>
    );
  }

  const days = [];
  for (const item of items) {
    const last = days[days.length - 1];
    if (last?.day === item.day) last.items.push(item);
    else days.push({ day: item.day, items: [item] });
  }

  return (
    <>
      {days.map(({ day, items: dayItems }) => (
        <section key={day} aria-label={dayLabel(day)}>
          <h3 className="px-1 pt-5 pb-2 text-[13.5px] font-semibold text-ink-3">{dayLabel(day)}</h3>
          <List>
            {dayItems.map((item) =>
              item.type === 'expense' ? (
                <ExpenseRow key={`e${item.e.id}`} e={item.e} people={people} meId={meId} groupId={groupId} />
              ) : (
                <PaymentRow key={`p${item.p.id}`} p={item.p} people={people} onClick={() => setOpenPayment(item.p)} />
              ),
            )}
          </List>
        </section>
      ))}
      <PaymentSheet payment={openPayment} people={people} meId={meId} onClose={() => setOpenPayment(null)} />
    </>
  );
}

/** What this expense means for you: "you lent ₹855", "you borrowed ₹285" or "not involved". */
function myEffect(e, meId) {
  const mine = e.splits.find((s) => s.member_id === meId)?.amount_paise || 0;
  if (e.paid_by === meId) {
    const lent = e.amount_paise - mine;
    return lent > 0 ? { label: 'you lent', paise: lent, tone: 'text-owed' } : { label: 'only you', tone: 'text-ink-3' };
  }
  if (mine > 0) return { label: 'you borrowed', paise: mine, tone: 'text-owe' };
  return { label: 'not involved', tone: 'text-ink-3' };
}

function ExpenseRow({ e, people, meId, groupId }) {
  const cat = categoryById(e.category);
  const fx = myEffect(e, meId);
  return (
    <Row
      to={`/groups/${groupId}/expenses/${e.id}`}
      leading={<Tile icon={cat.icon} tone={cat.tone} />}
      title={e.description}
      subtitle={`${people.first(e.paid_by)} paid ${formatINR(e.amount_paise)}`}
      trailing={
        <span className={cn('flex shrink-0 flex-col items-end leading-tight', fx.tone)}>
          <span className="text-[12.5px] font-medium">{fx.label}</span>
          {fx.paise ? <span className="text-[16px] font-semibold tabular-nums">{formatINR(fx.paise)}</span> : null}
        </span>
      }
    />
  );
}

function PaymentRow({ p, people, onClick }) {
  return (
    <Row
      onClick={onClick}
      leading={<Tile icon="rupee" tone="tone-2" />}
      title={`${people.first(p.from_member_id)} paid ${people.first(p.to_member_id, true)}`}
      subtitle={p.method === 'cash' ? 'Cash or other' : 'UPI'}
      trailing={<span className="text-[16px] font-semibold tabular-nums">{formatINR(p.amount_paise)}</span>}
    />
  );
}
