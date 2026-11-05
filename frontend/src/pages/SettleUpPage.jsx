import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { api, gql } from '../api';
import { SETTLE_SCREEN } from '../api/queries';
import { useApi } from '../hooks/useApi';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/cn';
import { copyText, shareOrFalse, tick } from '../lib/feedback';
import { amountWidth, formatAmountInput, formatINR, paiseToInput, parseToPaise } from '../lib/money';
import { peopleOf } from '../lib/people';
import { canOpenUpi, upiLink } from '../lib/upi';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { List, Row, SectionHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Content, ErrorPage, LargeTitle, Page, TopBar } from '../components/ui/Page';
import { Sheet } from '../components/ui/Sheet';
import { ListSkeleton } from '../components/ui/Skeleton';

const pairKey = (p) => `${p.from_member_id}-${p.to_member_id}`;

export default function SettleUpPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  // Members (for UPI IDs) and the payment plan in one GraphQL query; marking paid uses REST.
  const screen = useApi(() => gql(SETTLE_SCREEN, { id: Number(groupId) }), [groupId]);
  const [selected, setSelected] = useState(null);
  // Payments marked paid on this visit. They stay on the page, struck through, like lines on paper.
  const [paidHere, setPaidHere] = useState([]);
  const g = screen.data?.group;
  const people = useMemo(() => peopleOf(g), [g]);
  const meId = g?.my_member_id;
  useTitle('Settle up');

  if (screen.error && !g) return <ErrorPage error={screen.error} />;

  const isAdmin = g?.my_role === 'admin';
  const paid = paidHere.filter((x) => x.group_id === g?.id);
  const freshId = paid.at(-1)?.id;
  // Until the plan reloads, hide the line that was just paid so its struck copy takes its place.
  const waiting = new Set(paid.filter((x) => x.seen === screen.data).map(pairKey));
  const plan = g?.balances.suggested || [];
  const open = plan.filter((p) => !waiting.has(pairKey(p)));
  const sideOf = (p) => (p.from_member_id === meId ? 'pay' : p.to_member_id === meId ? 'get' : 'others');
  const sections = [
    { id: 'pay', title: 'You pay' },
    { id: 'get', title: 'You get back' },
    { id: 'others', title: 'Between others' },
  ].map((s) => ({ ...s, open: open.filter((p) => sideOf(p) === s.id), done: paid.filter((p) => sideOf(p) === s.id) }));
  const allSettled = (
    <EmptyState title="All settled up" className="mt-8" action={<Button variant="secondary" to={`/groups/${groupId}`}>Back to the group</Button>}>
      Nobody in {g?.name} owes anything right now.
    </EmptyState>
  );

  return (
    <Page>
      <TopBar back={`/groups/${groupId}`} backLabel={g?.name || 'Back'} title="Settle up" />
      <Content>
        <LargeTitle>Settle up</LargeTitle>
        <p className="mt-1 text-[16px] leading-snug text-ink-2">{g ? `The fewest payments that clear ${g.name}.` : ' '}</p>

        {!g ? (
          <ListSkeleton rows={3} className="mt-6" />
        ) : plan.length === 0 && paid.length === 0 ? (
          allSettled
        ) : (
          <>
            {sections.map(
              (s) =>
                s.open.length + s.done.length > 0 && (
                  <section key={s.id} aria-labelledby={`settle-${s.id}`}>
                    <SectionHeader id={`settle-${s.id}`} title={s.title} />
                    <List>
                      {s.open.map((p) => (
                        <PlanRow
                          key={pairKey(p)}
                          p={p}
                          people={people}
                          side={s.id}
                          onClick={s.id !== 'others' || isAdmin ? () => setSelected(p) : undefined}
                        />
                      ))}
                      {s.done.map((p) => (
                        <PaidRow key={p.id} p={p} people={people} fresh={p.id === freshId} />
                      ))}
                    </List>
                    {s.id === 'others' && s.open.length > 0 && !isAdmin && (
                      <p className="mt-3 px-1 text-[14px] leading-snug text-ink-2">Only the two people involved (or an admin) can mark these as paid.</p>
                    )}
                  </section>
                ),
            )}
            {plan.length === 0 ? allSettled : <WhyThese pairwise={g.balances.pairwise} plan={plan} people={people} />}
          </>
        )}
      </Content>
      <SettleSheet
        payment={selected}
        group={g}
        people={people}
        me={user}
        onClose={() => setSelected(null)}
        onPaid={(x) => setPaidHere((list) => [...list, { ...x, seen: screen.data }])}
        onUndo={(id) => setPaidHere((list) => list.filter((x) => x.id !== id))}
      />
    </Page>
  );
}

/** "Divas pays Aman", written the way it would be on the hisaab page. */
function PayLine({ p, people, done }) {
  const verb = done ? 'paid' : p.from_member_id === people.meId ? 'pay' : 'pays';
  return (
    <>
      {people.first(p.from_member_id)} <span className="font-normal text-ink-2">{verb}</span> {people.first(p.to_member_id, true)}
    </>
  );
}

function PlanRow({ p, people, side, onClick }) {
  // Your own lines carry money colour; the words "You pay" / "pays you" say the direction.
  const tone = side === 'pay' ? 'text-owe' : side === 'get' ? 'text-owed' : onClick ? 'text-ink' : 'text-ink-2';
  return (
    <Row
      onClick={onClick}
      title={<PayLine p={p} people={people} />}
      trailing={<span className={cn('tabular shrink-0 text-[19px] leading-[26px] font-bold', tone)}>{formatINR(p.amount_paise, { exact: true })}</span>}
      chevron={Boolean(onClick)}
    />
  );
}

/** A payment marked paid: struck through. The one just marked gets its line drawn across. */
function PaidRow({ p, people, fresh }) {
  return (
    <li>
      <div className={cn('flex items-center gap-3 px-1 py-3.5 text-ink-2', fresh && 'strike-draw')}>
        <span className={cn('min-w-0 flex-1 truncate text-[17px] leading-6 font-semibold', !fresh && 'struck')}>
          <PayLine p={p} people={people} done />
        </span>
        <span className={cn('tabular shrink-0 text-[19px] leading-[26px] font-bold', !fresh && 'struck')}>{formatINR(p.amount_paise, { exact: true })}</span>
      </div>
    </li>
  );
}

/** Answers the common confusion: "why do I pay someone I never borrowed from?" */
function WhyThese({ pairwise, plan, people }) {
  return (
    <details className="group mt-10 border-y border-line">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-1 py-2 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <span className="flex-1 pt-0.5 text-[16px] font-semibold">Why these payments?</span>
        <Icon name="chevronDown" size={18} className="shrink-0 text-ink-3 transition-transform duration-150 group-open:rotate-180" />
      </summary>
      <div className="px-1 pt-1 pb-5 text-[15px] leading-relaxed text-ink-2">
        <p className="max-w-[60ch]">
          Hisaab adds up everything in the group and combines debts, so fewer payments are needed. You might pay someone you never borrowed from
          directly. The total you pay stays the same.
        </p>
        {pairwise.length > plan.length && (
          <>
            <p className="mt-5 font-semibold text-ink">
              Without combining, it would take {pairwise.length} payments instead of {plan.length}:
            </p>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {pairwise.map((d) => (
                <li key={pairKey(d)} className="flex justify-between gap-3 py-2.5">
                  <span>
                    {people.first(d.from_member_id)} owes {people.first(d.to_member_id, true)}
                  </span>
                  <span className="tabular font-semibold text-ink">{formatINR(d.amount_paise)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}

/**
 * One payment from the plan.
 * - You pay: open your UPI app with the amount filled in. A UPI link can't report back, so when you return
 *   we ask "Did the payment go through?" before marking it paid. On a laptop, show the UPI ID instead.
 * - You get: remind them, or mark it as received.
 */
function SettleSheet({ payment, group, people, me, onClose, onPaid, onUndo }) {
  const toast = useToast();
  const [shown, setShown] = useState(payment);
  const [amountText, setAmountText] = useState('');
  const [stage, setStage] = useState('pay');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!payment) return;
    setShown(payment);
    setAmountText(formatAmountInput(paiseToInput(payment.amount_paise)));
    setStage('pay');
  }, [payment]);

  // After the UPI app opens, the page is hidden. When the user comes back, ask if it worked.
  useEffect(() => {
    if (stage !== 'waiting') return;
    const back = () => document.visibilityState === 'visible' && setStage('confirm');
    const fallback = setTimeout(() => setStage('confirm'), 2500);
    document.addEventListener('visibilitychange', back);
    return () => {
      clearTimeout(fallback);
      document.removeEventListener('visibilitychange', back);
    };
  }, [stage]);

  const p = payment || shown;
  if (!p || !group) return <Sheet open={false} onClose={onClose} />;

  const from = people.get(p.from_member_id);
  const to = people.get(p.to_member_id);
  const iPay = p.from_member_id === people.meId;
  const iGet = p.to_member_id === people.meId;
  const amount = parseToPaise(amountText);
  const tooMuch = amount > p.amount_paise;
  const mobile = canOpenUpi();

  async function markPaid(method) {
    if (!amount) return;
    setBusy(true);
    try {
      const created = await api.createSettlement(group.id, { from_member_id: p.from_member_id, to_member_id: p.to_member_id, amount_paise: amount, method });
      tick(15);
      onClose();
      onPaid({ id: created.id, group_id: group.id, from_member_id: p.from_member_id, to_member_id: p.to_member_id, amount_paise: amount });
      const msg = iGet ? `Marked ${formatINR(amount)} from ${people.first(p.from_member_id)} as received` : `Marked ${formatINR(amount)} to ${people.first(p.to_member_id, true)} as paid`;
      toast(msg, {
        action: {
          label: 'Undo',
          onClick: () => {
            onUndo(created.id);
            return api.deleteSettlement(created.id);
          },
        },
      });
    } catch (err) {
      toast(err.detail || err.message, { icon: 'info' });
    } finally {
      setBusy(false);
    }
  }

  function openUpi() {
    setStage('waiting');
    window.location.href = upiLink({ upiId: to.upi_id, name: to.name, amountPaise: amount, note: `Hisaab ${group.name}` });
  }

  async function remind() {
    const text = `Hi ${from.name.split(' ')[0]}, you owe me ${formatINR(p.amount_paise)} for ${group.name} on Hisaab.${me.upi_id ? ` My UPI ID is ${me.upi_id}.` : ''}`;
    if (!(await shareOrFalse({ text })) && (await copyText(text))) toast('Reminder copied. Paste it in your chat.', { icon: 'copy' });
  }

  const title = iPay ? `You pay ${to.name.split(' ')[0]}` : iGet ? `${from.name.split(' ')[0]} pays you` : `${from.name.split(' ')[0]} pays ${to.name.split(' ')[0]}`;

  return (
    <Sheet open={Boolean(payment)} onClose={onClose} title={stage === 'confirm' ? 'Did the payment go through?' : title}>
      {stage === 'confirm' ? (
        <div className="pb-1">
          <p className="text-[16px] leading-relaxed text-ink-2">
            Hisaab can&apos;t see inside your UPI app, so tell us. If it went through, we&apos;ll mark {formatINR(amount)} to {to.name.split(' ')[0]} as paid.
          </p>
          <div className="mt-6 grid gap-2">
            <Button size="lg" full loading={busy} onClick={() => markPaid('upi')} icon={<Icon name="check" size={20} strokeWidth={2.4} />}>
              Yes, mark as paid
            </Button>
            <Button variant="ghost" size="lg" full onClick={() => setStage('pay')}>
              No, not yet
            </Button>
          </div>
        </div>
      ) : (
        <div className="pb-1">
          <div className="flex items-center justify-center gap-3 pt-1 pb-6">
            <PersonBadge user={from} label={people.first(p.from_member_id)} me={iPay} />
            <Icon name="arrowRight" size={20} className="mb-7 shrink-0 text-ink-3" />
            <PersonBadge user={to} label={people.first(p.to_member_id)} me={iGet} />
          </div>

          <label className="block border-t border-line pt-5 text-center">
            <span className="text-[15px] font-semibold text-ink-2">Amount</span>
            <span className="mt-1 flex items-baseline justify-center font-display text-accent-text">
              <span className="mr-1 text-[28px]">₹</span>
              <input
                inputMode="decimal"
                value={amountText}
                onChange={(e) => setAmountText(formatAmountInput(e.target.value))}
                aria-label="Amount to pay"
                style={{ width: `calc(${amountWidth(amountText)} + 0.2ch)` }}
                className="tabular max-w-[70vw] rounded-lg bg-transparent text-center font-display text-[40px] leading-[1.25] caret-accent outline-none focus-visible:bg-sunken focus-visible:outline-none"
              />
            </span>
          </label>
          <p className={cn('mt-1 text-center text-[14px]', tooMuch ? 'font-medium text-owe' : 'text-ink-2')}>
            {tooMuch ? `That is more than the ${formatINR(p.amount_paise)} owed.` : 'You can change it to pay part of it.'}
          </p>

          <div className="mt-6 grid gap-2">
            {iPay && to.upi_id && mobile && (
              <>
                <Button size="lg" full disabled={!amount} onClick={openUpi} icon={<Icon name="smartphone" size={20} />}>
                  Pay {formatINR(amount)} with UPI
                </Button>
                <p className="pb-1 text-center text-[14px] text-ink-2">Opens GPay, PhonePe, Paytm or any UPI app.</p>
              </>
            )}
            {iPay && to.upi_id && !mobile && (
              <>
                <UpiBox upiId={to.upi_id} />
                <Button size="lg" full loading={busy} disabled={!amount} onClick={() => markPaid('upi')}>
                  I&apos;ve paid, mark as paid
                </Button>
              </>
            )}
            {iPay && !to.upi_id && (
              <p className="mb-2 border-y border-line py-3 text-[15px] leading-snug text-ink-2">
                {to.joined === false
                  ? `${to.name.split(' ')[0]} hasn't joined Hisaab yet, so there is no UPI ID. Pay another way, then mark it here.`
                  : `${to.name.split(' ')[0]} hasn't added a UPI ID yet. Pay another way, then mark it here.`}
              </p>
            )}
            {iGet && (
              <>
                <Button size="lg" full loading={busy} disabled={!amount} onClick={() => markPaid('cash')} icon={<Icon name="check" size={20} strokeWidth={2.4} />}>
                  Mark as received
                </Button>
                <Button variant="secondary" size="lg" full onClick={remind}>
                  Remind {from.name.split(' ')[0]}
                </Button>
              </>
            )}
            {!iGet && (
              <Button variant={iPay && to.upi_id ? 'ghost' : 'primary'} size="lg" full disabled={!amount || busy} onClick={() => markPaid('cash')}>
                {iPay ? 'Paid in cash or another way' : 'Mark as paid'}
              </Button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

function PersonBadge({ user, label, me }) {
  return (
    <span className="flex w-24 flex-col items-center gap-2">
      <Avatar user={user} size="lg" me={me} />
      <span className="max-w-full truncate text-[15px] font-semibold">{label}</span>
    </span>
  );
}

function UpiBox({ upiId }) {
  const toast = useToast();
  return (
    <div className="mb-2 border-y border-line py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] text-ink-2">UPI ID</p>
          <p className="truncate text-[17px] font-semibold">{upiId}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Icon name="copy" size={16} />} onClick={async () => (await copyText(upiId)) && toast('UPI ID copied', { icon: 'copy' })}>
          Copy
        </Button>
      </div>
      <p className="mt-3 text-[14px] leading-snug text-ink-2">
        UPI apps open only on phones. Pay from your phone with this ID, or open Hisaab on your phone for one-tap pay.
      </p>
    </div>
  );
}
