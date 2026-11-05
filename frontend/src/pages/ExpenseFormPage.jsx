import { useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { api, gql } from '../api';
import { EXPENSE_FORM } from '../api/queries';
import { useApi } from '../hooks/useApi';
import { useTitle } from '../hooks/useTitle';
import { useToast } from '../context/ToastContext';
import { CATEGORIES, categoryById, guessCategory, kindById } from '../lib/categories';
import { cn } from '../lib/cn';
import { dayLabel, todayISO } from '../lib/dates';
import { tick } from '../lib/feedback';
import { amountWidth, formatAmountInput, formatINR, MAX_EXPENSE_PAISE, paiseToInput, parseToPaise } from '../lib/money';
import { peopleOf } from '../lib/people';
import { computeSplits } from '../lib/split';
import { Icon } from '../components/Icon';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { Button, IconButton } from '../components/ui/Button';
import { Card, List, Row } from '../components/ui/Card';
import { FormError, inputClass, TextField } from '../components/ui/Field';
import { BottomBar, Content, ErrorPage, Page, TopBar } from '../components/ui/Page';
import { Segmented } from '../components/ui/Segmented';
import { Sheet } from '../components/ui/Sheet';
import { Skeleton } from '../components/ui/Skeleton';
import { Tile } from '../components/ui/Tile';

export default function ExpenseFormPage() {
  const { groupId, expenseId } = useParams();
  const editing = Boolean(expenseId);
  // Reads with GraphQL (group members, plus the expense when editing); saving uses REST.
  const form = useApi(
    () => gql(EXPENSE_FORM, { groupId: Number(groupId), expenseId: Number(expenseId || 0), editing }),
    [groupId, expenseId],
  );
  useTitle(editing ? 'Edit expense' : 'Add expense');

  if (form.error && !form.data) return <ErrorPage error={form.error} back={editing ? `/groups/${groupId}` : '/'} />;
  const existing = form.data?.expense ?? null;
  if (existing && existing.group_id !== Number(groupId))
    return <Navigate to={`/groups/${existing.group_id}/expenses/${existing.id}/edit`} replace />;
  if (!form.data) return <FormSkeleton editing={editing} />;
  return <ExpenseForm key={expenseId || 'new'} group={form.data.group} existing={existing} />;
}

function initialState(existing, members, meId) {
  const allIds = members.map((m) => m.id);
  if (!existing) {
    return {
      amountText: '',
      description: '',
      category: 'other',
      paidBy: meId,
      splitType: 'equal',
      included: new Set(allIds),
      exact: {},
      shares: Object.fromEntries(allIds.map((id) => [id, 1])),
      date: todayISO(),
      note: '',
    };
  }
  const e = existing;
  return {
    amountText: formatAmountInput(paiseToInput(e.amount_paise)),
    description: e.description,
    category: e.category,
    paidBy: e.paid_by,
    splitType: e.split_type,
    included: new Set(e.split_type === 'equal' ? e.splits.map((s) => s.member_id) : allIds),
    exact: e.split_type === 'exact' ? Object.fromEntries(e.splits.map((s) => [s.member_id, formatAmountInput(paiseToInput(s.amount_paise))])) : {},
    shares:
      e.split_type === 'shares'
        ? Object.fromEntries(allIds.map((id) => [id, e.splits.find((s) => s.member_id === id)?.shares || 0]))
        : Object.fromEntries(allIds.map((id) => [id, 1])),
    date: e.date,
    note: e.note || '',
  };
}

const SPLIT_WORD = { equal: 'equally', exact: 'by amounts', shares: 'by shares' };

function ExpenseForm({ group, existing }) {
  const navigate = useNavigate();
  const toast = useToast();
  const editing = Boolean(existing);
  const members = group.members;
  const meId = group.my_member_id; // ids in this form are MEMBER ids
  const people = useMemo(() => peopleOf(group), [group]);
  const [init] = useState(() => initialState(existing, members, meId));

  const [amountText, setAmountText] = useState(init.amountText);
  const [description, setDescription] = useState(init.description);
  const [category, setCategory] = useState(init.category);
  const [categoryPicked, setCategoryPicked] = useState(editing);
  const [paidBy, setPaidBy] = useState(init.paidBy);
  const [splitType, setSplitType] = useState(init.splitType);
  const [included, setIncluded] = useState(init.included);
  const [exact, setExact] = useState(init.exact);
  const [shares, setShares] = useState(init.shares);
  const [date, setDate] = useState(init.date);
  const [note, setNote] = useState(init.note);
  const [noteOpen, setNoteOpen] = useState(Boolean(init.note));
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const amount = parseToPaise(amountText);
  const cat = categoryById(categoryPicked ? category : guessCategory(description));

  const splitRows = useMemo(() => {
    if (splitType === 'equal') return members.filter((m) => included.has(m.id)).map((m) => ({ member_id: m.id }));
    if (splitType === 'exact') return members.map((m) => ({ member_id: m.id, amount_paise: parseToPaise(exact[m.id]) })).filter((r) => r.amount_paise > 0);
    return members.map((m) => ({ member_id: m.id, shares: shares[m.id] || 0 })).filter((r) => r.shares > 0);
  }, [splitType, members, included, exact, shares]);

  const preview = useMemo(
    () => (amount > 0 && splitRows.length ? computeSplits({ amount_paise: amount, split_type: splitType, splits: splitRows }) : []),
    [amount, splitRows, splitType],
  );
  const shareOf = Object.fromEntries(preview.map((p) => [p.member_id, p.amount_paise]));
  const exactSum = splitRows.reduce((t, r) => t + (r.amount_paise || 0), 0);
  const totalShares = Object.values(shares).reduce((t, s) => t + (s || 0), 0);
  const participants = members.filter((m) => splitRows.some((r) => r.member_id === m.id));

  const problem = !amount
    ? 'Enter an amount'
    : amount > MAX_EXPENSE_PAISE
      ? `Keep it under ${formatINR(MAX_EXPENSE_PAISE)}`
      : !description.trim()
        ? 'Add a description'
        : !splitRows.length
          ? splitType === 'shares'
            ? 'Give at least one person a share'
            : 'Pick who to split with'
          : splitType === 'exact' && exactSum !== amount
            ? exactSum < amount
              ? `${formatINR(amount - exactSum)} left to assign`
              : `${formatINR(exactSum - amount)} more than the total`
            : null;

  function summary() {
    const n = participants.length;
    const who = n === members.length && n > 1 ? `everyone (${n})` : `${n} ${n === 1 ? 'person' : 'people'}`;
    if (splitType === 'equal') {
      if (!amount || !n) return who;
      const values = [...new Set(preview.map((p) => p.amount_paise))];
      const each = values.length > 1 ? `${formatINR(Math.max(...values))} or ${formatINR(Math.min(...values))}` : formatINR(values[0]);
      return `${each} each · ${who}`;
    }
    if (splitType === 'exact') return amount && exactSum !== amount ? problem : `Custom amounts · ${who}`;
    return `${totalShares} ${totalShares === 1 ? 'share' : 'shares'} · ${who}`;
  }

  async function save(e) {
    e?.preventDefault();
    if (problem || busy) return;
    setBusy(true);
    setError('');
    const body = {
      description: description.trim(),
      amount_paise: amount,
      paid_by: paidBy,
      category: cat.id,
      date,
      note: noteOpen ? note : '',
      split_type: splitType,
      splits: splitRows,
    };
    try {
      if (editing) {
        await api.updateExpense(existing.id, body);
        tick();
        toast('Changes saved');
        navigate(`/groups/${group.id}/expenses/${existing.id}`, { replace: true });
      } else {
        const created = await api.createExpense(group.id, body);
        tick();
        const each = splitType === 'equal' && preview.length > 1 ? ` · ${formatINR(preview[preview.length - 1].amount_paise)} each` : '';
        toast(`“${created.description}” added${each}`, { action: { label: 'Undo', onClick: () => api.deleteExpense(created.id) } });
        navigate(`/groups/${group.id}`, { replace: true });
      }
    } catch (err) {
      setError(err.detail || err.message);
      setBusy(false);
    }
  }

  const close = () => setSheet(null);
  const kind = kindById(group.kind);
  const amountSize = amountText.length > 10 ? 'text-[40px]' : amountText.length > 7 ? 'text-[48px]' : 'text-[60px]';

  return (
    <Page>
      <TopBar
        alwaysShowTitle
        title={editing ? 'Edit expense' : 'Add expense'}
        left={
          <IconButton label="Close without saving" onClick={() => navigate(editing ? `/groups/${group.id}/expenses/${existing.id}` : `/groups/${group.id}`)}>
            <Icon name="x" size={22} />
          </IconButton>
        }
      />
      <Content className="pt-1">
        <form id="expense-form" onSubmit={save} noValidate>
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1 text-[13.5px] text-ink-2">
              <Tile icon={kind.icon} tone={kind.tone} size="xs" className="size-6 rounded-full" />
              {group.name}
            </span>
          </div>

          {/* Amount: the biggest thing on the screen, with the number keypad open straight away. */}
          <div className="mt-7 flex flex-col items-center">
            <label htmlFor="amount" className="sr-only">
              Amount in rupees
            </label>
            <div className="flex items-baseline justify-center">
              <span className={cn('mr-1 text-[38px] font-semibold transition-colors', amount ? 'text-ink' : 'text-ink-3')}>₹</span>
              <input
                id="amount"
                inputMode="decimal"
                autoComplete="off"
                autoFocus={!editing}
                placeholder="0"
                value={amountText}
                onChange={(e) => setAmountText(formatAmountInput(e.target.value))}
                style={{ width: amountWidth(amountText) }}
                className={cn(
                  'peer max-w-[80vw] bg-transparent text-center font-bold tracking-[-0.04em] tabular-nums caret-accent outline-none placeholder:text-ink-3/50 focus-visible:outline-none',
                  amountSize,
                )}
              />
            </div>
            <span className="mt-1 h-[3px] w-20 rounded-full bg-line transition-colors peer-focus:bg-accent" aria-hidden="true" />
          </div>

          {/* Description; the category icon is guessed from the words. */}
          <Card className="mt-7 flex items-center gap-2 p-1.5 has-[input:focus]:border-accent has-[input:focus]:ring-4 has-[input:focus]:ring-accent/15">
            <button
              type="button"
              onClick={() => setSheet('category')}
              aria-label={`Category: ${cat.label}. Change category`}
              className="rounded-xl transition-transform active:scale-95"
            >
              <Tile icon={cat.icon} tone={cat.tone} />
            </button>
            <input
              aria-label="Description"
              placeholder="What was it for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={60}
              enterKeyHint="done"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 bg-transparent px-1 text-[17px] outline-none placeholder:text-ink-3 focus-visible:outline-none"
            />
          </Card>
          <p className="mt-1.5 px-2 text-[13px] text-ink-3">
            {description.trim() ? (
              <>
                Category: <span className="font-medium text-ink-2">{cat.label}</span>
                {!categoryPicked && ' (guessed, tap the icon to change)'}
              </>
            ) : (
              'For example: Wi-Fi recharge, dinner, cab to the station'
            )}
          </p>

          {/* "Paid by You and split equally": every bold word can be tapped. */}
          <Card className="mt-4 p-4">
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[16.5px] text-ink-2">
              Paid by
              <Chip onClick={() => setSheet('payer')} label={`Paid by ${people.name(paidBy)}. Change`}>
                <Avatar user={people.get(paidBy)} size="xs" />
                {people.first(paidBy)}
              </Chip>
              and split
              <Chip onClick={() => setSheet('split')} label={`Split ${SPLIT_WORD[splitType]}. Change`}>
                {SPLIT_WORD[splitType]}
              </Chip>
            </p>
            <button
              type="button"
              onClick={() => setSheet('split')}
              className="mt-3.5 flex w-full items-center gap-2.5 border-t border-line pt-3.5 text-left"
            >
              <AvatarStack users={participants} size="xs" max={6} />
              <span className={cn('min-w-0 flex-1 truncate text-[14.5px]', splitType === 'exact' && amount && exactSum !== amount ? 'text-owe' : 'text-ink-2')}>
                {summary()}
              </span>
              <Icon name="chevronRight" size={17} className="text-ink-3" />
            </button>
          </Card>

          <div className="mt-3 flex flex-wrap gap-2">
            <DateChip value={date} onChange={setDate} />
            {!noteOpen && (
              <Chip onClick={() => setNoteOpen(true)} plain>
                <Icon name="note" size={16} />
                Add note
              </Chip>
            )}
          </div>
          {noteOpen && (
            <TextField
              as="textarea"
              className="mt-4"
              label="Note"
              placeholder="Anything the group should know"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              autoFocus={!init.note}
            />
          )}
          <div className="mt-4">
            <FormError>{error}</FormError>
          </div>
        </form>
      </Content>

      <BottomBar>
        {problem ? (
          <div role="status" aria-live="polite" className="flex h-[52px] items-center justify-center rounded-[14px] bg-sunken px-4 text-[16px] font-medium text-ink-2">
            {problem}
          </div>
        ) : (
          <Button type="submit" form="expense-form" size="lg" full loading={busy}>
            {editing ? 'Save changes' : `Add ${formatINR(amount)}`}
          </Button>
        )}
      </BottomBar>

      {/* Who paid */}
      <Sheet open={sheet === 'payer'} onClose={close} title="Who paid?">
        <List role="radiogroup" aria-label="Who paid" className="bg-surface/70">
          {members.map((m) => (
            <Row
              key={m.id}
              role="radio"
              aria-checked={paidBy === m.id}
              onClick={() => {
                setPaidBy(m.id);
                close();
              }}
              leading={<Avatar user={m} />}
              title={people.name(m.id)}
              subtitle={m.joined ? undefined : 'Not joined yet'}
              trailing={paidBy === m.id ? <Icon name="check" size={20} strokeWidth={2.4} className="text-accent-text" /> : null}
            />
          ))}
        </List>
      </Sheet>

      {/* How to split */}
      <Sheet
        open={sheet === 'split'}
        onClose={close}
        title={amount ? `Split ${formatINR(amount)}` : 'How to split'}
        footer={
          <div className="space-y-3">
            <SplitStatus type={splitType} amount={amount} exactSum={exactSum} totalShares={totalShares} count={participants.length} total={members.length} />
            <Button size="lg" full onClick={close}>
              Done
            </Button>
          </div>
        }
      >
        <Segmented
          label="How to split"
          options={[
            { value: 'equal', label: 'Equally' },
            { value: 'exact', label: 'Amounts' },
            { value: 'shares', label: 'Shares' },
          ]}
          value={splitType}
          onChange={setSplitType}
        />
        <p className="mt-3 px-1 text-[14px] leading-snug text-ink-2">
          {splitType === 'equal' && 'Everyone ticked pays the same. If it does not divide evenly, the extra paise go to one person.'}
          {splitType === 'exact' && (amount ? `Type what each person owes. It has to add up to ${formatINR(amount)}.` : 'Type what each person owes.')}
          {splitType === 'shares' && 'Someone with 2 shares pays twice as much as someone with 1. Useful for rent by room size.'}
        </p>
        {splitType === 'equal' && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="rounded-lg px-1 text-[14px] font-semibold text-accent-text"
              onClick={() => setIncluded(included.size === members.length ? new Set() : new Set(members.map((m) => m.id)))}
            >
              {included.size === members.length ? 'Clear all' : 'Select everyone'}
            </button>
          </div>
        )}
        <List className="mt-2 bg-surface/70">
          {members.map((m) => {
            const name = people.name(m.id);
            if (splitType === 'equal') {
              const on = included.has(m.id);
              return (
                <li key={m.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={on}
                      onChange={() => {
                        const next = new Set(included);
                        on ? next.delete(m.id) : next.add(m.id);
                        setIncluded(next);
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid size-[22px] shrink-0 place-items-center rounded-[7px] border-2 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-accent/25',
                        on ? 'border-accent bg-accent text-white' : 'border-line-strong',
                      )}
                    >
                      {on && <Icon name="check" size={14} strokeWidth={3} />}
                    </span>
                    <Avatar user={m} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[16px]">{name}</span>
                    <span className={cn('text-[15px] tabular-nums', on ? 'font-semibold' : 'text-ink-3')}>{on && amount ? formatINR(shareOf[m.id] || 0) : '—'}</span>
                  </label>
                </li>
              );
            }
            if (splitType === 'exact') {
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar user={m} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-[16px]">{name}</span>
                  <span className="relative w-32">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3">₹</span>
                    <input
                      inputMode="decimal"
                      aria-label={`Amount for ${name}`}
                      placeholder="0"
                      value={exact[m.id] || ''}
                      onChange={(e) => setExact({ ...exact, [m.id]: formatAmountInput(e.target.value) })}
                      className={cn(inputClass, 'h-10 pr-3 pl-7 text-right tabular-nums')}
                    />
                  </span>
                </li>
              );
            }
            const s = shares[m.id] || 0;
            return (
              <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar user={m} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px]">{name}</span>
                  <span className="block text-[13px] text-ink-3 tabular-nums">{s && amount ? formatINR(shareOf[m.id] || 0) : 'not included'}</span>
                </span>
                <span className="flex items-center rounded-xl border border-line bg-surface">
                  <StepButton label={`Fewer shares for ${name}`} disabled={s === 0} onClick={() => setShares({ ...shares, [m.id]: s - 1 })} icon="minus" />
                  <span className="w-8 text-center text-[16px] font-semibold tabular-nums" aria-live="polite" aria-label={`${s} shares`}>
                    {s}
                  </span>
                  <StepButton label={`More shares for ${name}`} disabled={s >= 99} onClick={() => setShares({ ...shares, [m.id]: s + 1 })} icon="plus" />
                </span>
              </li>
            );
          })}
        </List>
      </Sheet>

      {/* Category */}
      <Sheet open={sheet === 'category'} onClose={close} title="Category">
        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cat.id === c.id}
              onClick={() => {
                setCategory(c.id);
                setCategoryPicked(true);
                close();
              }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl border bg-surface/70 px-2 py-3.5 text-[14px] font-medium transition-[transform,border-color] active:scale-95',
                cat.id === c.id ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-line hover:border-line-strong',
              )}
            >
              <Tile icon={c.icon} tone={c.tone} />
              {c.label}
            </button>
          ))}
        </div>
      </Sheet>
    </Page>
  );
}

function Chip({ children, onClick, label, plain }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-2.5 transition-[transform,border-color,background-color] duration-150 active:scale-[0.97]',
        plain
          ? 'border-line bg-surface text-[14.5px] font-medium text-ink-2 hover:text-ink'
          : 'border-line-strong bg-surface-2 text-[16px] font-semibold text-ink hover:border-accent',
      )}
    >
      {children}
      {!plain && <Icon name="chevronDown" size={15} strokeWidth={2.2} className="text-ink-3" />}
    </button>
  );
}

/** A visible, bordered date chip (Splitwise hides the date as a tiny icon; people miss it). */
function DateChip({ value, onChange }) {
  const ref = useRef(null);
  return (
    <span className="relative inline-flex rounded-[10px] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/25">
      <span
        aria-hidden="true"
        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-surface px-2.5 text-[14.5px] font-medium text-ink-2"
      >
        <Icon name="calendar" size={16} />
        {dayLabel(value)}
      </span>
      <input
        ref={ref}
        type="date"
        aria-label={`Date: ${dayLabel(value)}. Change date`}
        value={value}
        max={todayISO()}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={() => {
          try {
            ref.current?.showPicker?.();
          } catch {
            /* older browsers open it on their own */
          }
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </span>
  );
}

function StepButton({ label, onClick, disabled, icon }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 place-items-center rounded-[10px] text-ink-2 transition-[transform,background-color] hover:bg-sunken active:scale-90 disabled:opacity-35"
    >
      <Icon name={icon} size={17} strokeWidth={2.2} />
    </button>
  );
}

function SplitStatus({ type, amount, exactSum, totalShares, count, total }) {
  let text = `${count} of ${total} ${total === 1 ? 'person' : 'people'} included`;
  let tone = 'text-ink-2';
  let icon = 'users';
  if (type === 'exact' && amount) {
    if (exactSum === amount) [text, tone, icon] = [`Adds up to ${formatINR(amount)}`, 'text-owed', 'checkCircle'];
    else if (exactSum < amount) [text, tone, icon] = [`${formatINR(amount - exactSum)} left to assign`, 'text-owe', 'info'];
    else [text, tone, icon] = [`${formatINR(exactSum - amount)} more than the total`, 'text-owe', 'info'];
  }
  if (type === 'shares') text = `${totalShares} ${totalShares === 1 ? 'share' : 'shares'} between ${count} ${count === 1 ? 'person' : 'people'}`;
  return (
    <p role="status" aria-live="polite" className={cn('flex items-center justify-center gap-1.5 text-[14.5px] font-medium', tone)}>
      <Icon name={icon} size={16} />
      {text}
    </p>
  );
}

function FormSkeleton({ editing }) {
  return (
    <Page>
      <TopBar alwaysShowTitle title={editing ? 'Edit expense' : 'Add expense'} />
      <Content>
        <div className="flex flex-col items-center gap-6 pt-10" aria-busy="true">
          <Skeleton className="h-14 w-40" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </Content>
    </Page>
  );
}
