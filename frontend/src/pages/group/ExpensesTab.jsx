import { useState } from 'react';
import { categoryById } from '../../lib/categories';
import { dayLabel, toISODate } from '../../lib/dates';
import { formatINR } from '../../lib/money';
import { cn } from '../../lib/cn';
import { List, Row } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { PaymentSheet } from './PaymentSheet';

/** Expenses and payments together, newest first, grouped by day. */
export function ExpensesTab({ groupId, expenses, payments, people, meId }) {
  const [openPayment, setOpenPayment] = useState(null);

  if (!expenses || !payments) return <ListSkeleton rows={5} className="mt-6" />;

  const items = [
    ...expenses.map((e) => ({ type: 'expense', day: e.date, at: e.created_at, e })),
    ...payments.map((p) => ({ type: 'payment', day: toISODate(new Date(p.created_at)), at: p.created_at, p })),
  ].sort((a, b) => b.day.localeCompare(a.day) || b.at.localeCompare(a.at));

  if (!items.length) {
    return (
      <EmptyState title="No expenses yet" className="mt-6">
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
          <h3 className="px-1 pt-6 pb-2 text-[14px] leading-5 font-semibold text-ink-2">{dayLabel(day)}</h3>
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

/** What this expense means for you: "you get back ₹855", "you owe ₹285" or "not involved". */
function myEffect(e, meId) {
  const mine = e.splits.find((s) => s.member_id === meId)?.amount_paise || 0;
  if (e.paid_by === meId) {
    const lent = e.amount_paise - mine;
    return lent > 0 ? { label: 'you get back', paise: lent, tone: 'text-owed' } : { label: 'only you', tone: 'text-ink-2' };
  }
  if (mine > 0) return { label: 'you owe', paise: mine, tone: 'text-owe' };
  return { label: 'not involved', tone: 'text-ink-2' };
}

/** The word over the amount on the right of a row, like the balance on the home screen. */
function Effect({ label, paise, tone }) {
  return (
    <span className={cn('flex shrink-0 flex-col items-end text-right', tone)}>
      <span className="text-[13px] leading-[18px] font-semibold">{label}</span>
      {paise ? <span className="tabular text-[17px] leading-6 font-bold">{formatINR(paise, { exact: true })}</span> : null}
    </span>
  );
}

function ExpenseRow({ e, people, meId, groupId }) {
  const cat = categoryById(e.category);
  return (
    <Row
      to={`/groups/${groupId}/expenses/${e.id}`}
      title={e.description}
      subtitle={`${people.first(e.paid_by)} paid ${formatINR(e.amount_paise)} · ${cat.label}`}
      trailing={<Effect {...myEffect(e, meId)} />}
    />
  );
}

function PaymentRow({ p, people, onClick }) {
  return (
    <Row
      onClick={onClick}
      title={`${people.first(p.from_member_id)} paid ${people.first(p.to_member_id, true)}`}
      subtitle={`Payment · ${p.method === 'cash' ? 'cash or other' : 'UPI'}`}
      trailing={<span className="tabular shrink-0 text-[17px] leading-6 font-bold">{formatINR(p.amount_paise, { exact: true })}</span>}
    />
  );
}
