import { useId, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { api, gql } from '../api';
import { EXPENSE_FORM } from '../api/queries';
import { useApi } from '../hooks/useApi';
import { useTitle } from '../hooks/useTitle';
import { useToast } from '../context/ToastContext';
import { CATEGORIES, categoryById, guessCategory } from '../lib/categories';
import { cn } from '../lib/cn';
import { dayLabel, todayISO } from '../lib/dates';
import { tick } from '../lib/feedback';
import { formatAmountInput, formatINR, MAX_EXPENSE_PAISE, paiseToInput, parseToPaise } from '../lib/money';
import { peopleOf } from '../lib/people';
import { computeSplits } from '../lib/split';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/ui/Avatar';
import { Button, IconButton } from '../components/ui/Button';
import { List, Row } from '../components/ui/Card';
import { FormError, inputClass, TextField } from '../components/ui/Field';
import { BottomBar, Content, ErrorPage, Page, TopBar } from '../components/ui/Page';
import { Segmented } from '../components/ui/Segmented';
import { Sheet } from '../components/ui/Sheet';
import { Skeleton } from '../components/ui/Skeleton';

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
  // The figure shrinks a step at a time as it gets longer, so ₹10,00,000.00 still fits on one line.
  const len = amountText.length;
  const amountSize = len > 13 ? 'text-[30px]' : len > 10 ? 'text-[36px]' : len > 7 ? 'text-[44px]' : 'text-[52px]';
  const exactOff = splitType === 'exact' && amount > 0 && exactSum !== amount;
  const guessed = !categoryPicked && Boolean(description.trim());

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
      <Content>
        <form id="expense-form" onSubmit={save} noValidate>
          <p className="pt-2 text-[16px] text-ink-2">{group.name}</p>

          {/* Amount: the biggest thing on the screen, written in ballpoint blue on a line. The number keypad opens straight away. */}
          <div className="mt-5">
            <label htmlFor="amount" className="block text-[15px] font-semibold text-ink">
              Amount<span className="sr-only"> in rupees</span>
            </label>
            <div
              className={cn(
                'mt-1 flex items-baseline gap-1.5 border-b-2 border-line-strong pt-1 pb-1.5 font-display leading-[1.3] focus-within:border-accent-text',
                amountSize,
              )}
            >
              <span aria-hidden="true" className={amount ? 'text-accent-text' : 'text-ink-3'}>
                ₹
              </span>
              <input
                id="amount"
                inputMode="decimal"
                autoComplete="off"
                autoFocus={!editing}
                placeholder="0"
                value={amountText}
                onChange={(e) => setAmountText(formatAmountInput(e.target.value))}
                className="tabular min-w-0 flex-1 bg-transparent text-accent-text caret-accent-text outline-none placeholder:text-ink-3 focus-visible:outline-none"
              />
            </div>
          </div>

          <TextField
            className="mt-6"
            label="Description"
            placeholder="What was it for?"
            hint="For example: Wi-Fi recharge, dinner, cab to the station"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={60}
            enterKeyHint="done"
            autoComplete="off"
          />

          {/* Category: guessed from the description, shown as words. Tapping one fixes it. */}
          <div className="mt-6" role="group" aria-labelledby="category-label">
            <p id="category-label" className="text-[15px] font-semibold text-ink">
              Category
              {guessed && <span className="font-normal text-ink-2"> · guessed, tap to change</span>}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                // Nothing is shown as chosen until the description suggests a category or the person taps one.
                // (If they never do, the expense is still saved as "Other".)
                const on = cat.id === c.id && (categoryPicked || cat.id !== 'other');
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setCategory(c.id);
                      setCategoryPicked(true);
                    }}
                    className={cn(
                      'h-10 rounded-lg border-[1.5px] px-3 pt-0.5 text-[15px] font-semibold',
                      on ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong bg-surface text-ink hover:bg-surface-2 active:bg-sunken',
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Who paid and how it is split, written out as two lines. Each opens its own sheet. */}
          <List className="mt-8">
            <Row
              onClick={() => setSheet('payer')}
              aria-label={`Paid by ${people.name(paidBy)}. Change`}
              title={
                <>
                  <span className="font-normal text-ink-2">Paid by </span>
                  {people.name(paidBy)}
                </>
              }
              trailing={<Avatar user={people.get(paidBy)} size="sm" me={paidBy === meId} />}
              chevron
            />
            <Row
              onClick={() => setSheet('split')}
              title={
                <>
                  <span className="font-normal text-ink-2">Split </span>
                  {SPLIT_WORD[splitType]}
                </>
              }
              subtitle={<span className={cn('tabular', exactOff && 'font-medium text-owe')}>{summary()}</span>}
              chevron
            />
          </List>

          <DateField className="mt-7" value={date} onChange={setDate} />

          {noteOpen ? (
            <TextField
              as="textarea"
              className="mt-6"
              label="Note"
              placeholder="Anything the group should know"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              autoFocus={!init.note}
            />
          ) : (
            <Button variant="quiet" size="sm" className="mt-4 -ml-1 px-1.5" icon={<Icon name="plus" size={16} />} onClick={() => setNoteOpen(true)}>
              Add note
            </Button>
          )}

          {error && (
            <div className="mt-6">
              <FormError>{error}</FormError>
            </div>
          )}
        </form>
      </Content>

      <BottomBar>
        {problem && (
          <p role="status" aria-live="polite" className={cn('truncate pb-2 text-center text-[15px]', exactOff ? 'font-semibold text-owe' : 'text-ink-2')}>
            {problem}
          </p>
        )}
        <Button type="submit" form="expense-form" size="lg" full loading={busy} disabled={Boolean(problem)}>
          {editing ? 'Save changes' : 'Save expense'}
        </Button>
      </BottomBar>

      {/* Who paid */}
      <Sheet open={sheet === 'payer'} onClose={close} title="Who paid?">
        <List role="radiogroup" aria-label="Who paid">
          {members.map((m) => (
            <Row
              key={m.id}
              role="radio"
              aria-checked={paidBy === m.id}
              onClick={() => {
                setPaidBy(m.id);
                close();
              }}
              leading={<Avatar user={m} me={m.id === meId} />}
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
        <p className="mt-3 text-[15px] leading-snug text-ink-2">
          {splitType === 'equal' && 'Everyone ticked pays the same. If it does not divide evenly, the extra paise go to one person.'}
          {splitType === 'exact' && (amount ? `Type what each person owes. It has to add up to ${formatINR(amount)}.` : 'Type what each person owes.')}
          {splitType === 'shares' && 'Someone with 2 shares pays twice as much as someone with 1. Useful for rent by room size.'}
        </p>
        {splitType === 'equal' && (
          <div className="mt-1 flex justify-end">
            <Button
              variant="quiet"
              size="sm"
              className="-mr-1 px-1.5"
              onClick={() => setIncluded(included.size === members.length ? new Set() : new Set(members.map((m) => m.id)))}
            >
              {included.size === members.length ? 'Clear all' : 'Select everyone'}
            </Button>
          </div>
        )}
        <List className={splitType === 'equal' ? 'mt-1' : 'mt-4'}>
          {members.map((m) => {
            const name = people.name(m.id);
            if (splitType === 'equal') {
              const on = included.has(m.id);
              return (
                <li key={m.id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-1 py-3 hover:bg-surface-2">
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
                        'grid size-[22px] shrink-0 place-items-center rounded-[5px] border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-text',
                        on ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong bg-surface',
                      )}
                    >
                      {on && <Icon name="check" size={14} strokeWidth={3} />}
                    </span>
                    <Avatar user={m} size="sm" me={m.id === meId} />
                    <span className={cn('min-w-0 flex-1 truncate text-[16px]', on ? 'font-medium text-ink' : 'text-ink-2')}>{name}</span>
                    {on ? (
                      amount > 0 && <span className="tabular text-[16px] font-semibold">{formatINR(shareOf[m.id] || 0)}</span>
                    ) : (
                      <span className="text-[14px] text-ink-2">not included</span>
                    )}
                  </label>
                </li>
              );
            }
            if (splitType === 'exact') {
              return (
                <li key={m.id} className="flex items-center gap-3 px-1 py-2.5">
                  <Avatar user={m} size="sm" me={m.id === meId} />
                  <span className="min-w-0 flex-1 truncate text-[16px] font-medium">{name}</span>
                  <span className="relative w-32 shrink-0">
                    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 pt-0.5 text-ink-2">
                      ₹
                    </span>
                    <input
                      inputMode="decimal"
                      aria-label={`Amount for ${name}`}
                      placeholder="0"
                      value={exact[m.id] || ''}
                      onChange={(e) => setExact({ ...exact, [m.id]: formatAmountInput(e.target.value) })}
                      className={cn(inputClass, 'tabular h-11 pr-3 pl-7 text-right')}
                    />
                  </span>
                </li>
              );
            }
            const s = shares[m.id] || 0;
            return (
              <li key={m.id} className="flex items-center gap-3 px-1 py-2.5">
                <Avatar user={m} size="sm" me={m.id === meId} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-medium">{name}</span>
                  <span className="tabular block text-[14px] text-ink-2">{s && amount ? formatINR(shareOf[m.id] || 0) : 'not included'}</span>
                </span>
                <span className="flex shrink-0 items-center rounded-[10px] border-[1.5px] border-line-strong">
                  <StepButton label={`Fewer shares for ${name}`} disabled={s === 0} onClick={() => setShares({ ...shares, [m.id]: s - 1 })} icon="minus" />
                  <span className="tabular w-8 pt-0.5 text-center text-[16px] font-semibold" aria-live="polite" aria-label={`${s} shares`}>
                    {s}
                  </span>
                  <StepButton label={`More shares for ${name}`} disabled={s >= 99} onClick={() => setShares({ ...shares, [m.id]: s + 1 })} icon="plus" />
                </span>
              </li>
            );
          })}
        </List>
      </Sheet>
    </Page>
  );
}

/**
 * Looks like any other text field, but shows the date in words ("Today", "Mon, 2 Nov").
 * A transparent native date input sits on top, so tapping anywhere opens the phone's own date picker.
 */
function DateField({ value, onChange, className }) {
  const ref = useRef(null);
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[15px] font-semibold text-ink">
        Date
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
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
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        <span
          aria-hidden="true"
          className={cn(
            inputClass,
            'flex items-center justify-between peer-hover:bg-surface-2 peer-focus:border-accent-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-text',
          )}
        >
          {dayLabel(value)}
          <Icon name="calendar" size={18} className="-mt-0.5 text-ink-2" />
        </span>
      </div>
    </div>
  );
}

function StepButton({ label, onClick, disabled, icon }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-11 place-items-center rounded-[9px] text-ink-2 hover:bg-sunken hover:text-ink active:bg-sunken disabled:opacity-35"
    >
      <Icon name={icon} size={17} strokeWidth={2.2} />
    </button>
  );
}

/** The running check under the split list: red with the gap when the amounts don't add up, green when they do. */
function SplitStatus({ type, amount, exactSum, totalShares, count, total }) {
  let text = `${count} of ${total} ${total === 1 ? 'person' : 'people'} included`;
  let color = 'font-medium text-ink-2';
  let addsUp = false;
  if (type === 'exact' && amount) {
    if (exactSum === amount) [text, color, addsUp] = [`Adds up to ${formatINR(amount)}`, 'font-semibold text-owed', true];
    else if (exactSum < amount) [text, color] = [`${formatINR(amount - exactSum)} left to assign`, 'font-semibold text-owe'];
    else [text, color] = [`${formatINR(exactSum - amount)} more than the total`, 'font-semibold text-owe'];
  }
  if (type === 'shares') text = `${totalShares} ${totalShares === 1 ? 'share' : 'shares'} between ${count} ${count === 1 ? 'person' : 'people'}`;
  return (
    <p role="status" aria-live="polite" className={cn('tabular flex items-center justify-center gap-1.5 text-[15px]', color)}>
      {addsUp && <Icon name="check" size={16} strokeWidth={2.4} className="-mt-0.5" />}
      {text}
    </p>
  );
}

function FormSkeleton({ editing }) {
  return (
    <Page>
      <TopBar alwaysShowTitle title={editing ? 'Edit expense' : 'Add expense'} />
      <Content>
        <div className="pt-3" aria-busy="true">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-7 h-4 w-16" />
          <Skeleton className="mt-3 h-14 w-48" />
          <Skeleton className="mt-8 h-4 w-24" />
          <Skeleton className="mt-2.5 h-12 w-full rounded-[10px]" />
          <div className="mt-8 flex flex-wrap gap-2">
            {['w-16', 'w-24', 'w-14', 'w-14', 'w-[72px]', 'w-14'].map((w, i) => (
              <Skeleton key={i} className={cn('h-10 rounded-lg', w)} />
            ))}
          </div>
        </div>
      </Content>
    </Page>
  );
}
