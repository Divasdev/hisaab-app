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
import { Tile } from '../components/ui/Tile';

export default function SettleUpPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  // Members (for UPI IDs) and the payment plan in one GraphQL query; marking paid uses REST.
  const screen = useApi(() => gql(SETTLE_SCREEN, { id: Number(groupId) }), [groupId]);
  const [selected, setSelected] = useState(null);
  const g = screen.data?.group;
  const people = useMemo(() => peopleOf(g), [g]);
  const meId = g?.my_member_id;
  useTitle('Settle up');

  if (screen.error && !g) return <ErrorPage error={screen.error} />;

  const plan = g?.balances.suggested || [];
  const isAdmin = g?.my_role === 'admin';
  const youPay = plan.filter((p) => p.from_member_id === meId);
  const youGet = plan.filter((p) => p.to_member_id === meId);
  const others = plan.filter((p) => p.from_member_id !== meId && p.to_member_id !== meId);

  return (
    <Page>
      <TopBar back={`/groups/${groupId}`} backLabel={g?.name || 'Back'} title="Settle up" />
      <Content>
        <LargeTitle>Settle up</LargeTitle>
        <p className="mt-1.5 px-1 text-[15.5px] text-ink-2">{g ? `The fewest payments that clear ${g.name}.` : ' '}</p>

        {!g ? (
          <ListSkeleton rows={3} className="mt-6" />
        ) : plan.length === 0 ? (
          <EmptyState icon="checkCircle" tone="tone-2" title="Everyone is settled up" className="mt-4" action={<Button variant="secondary" to={`/groups/${groupId}`}>Back to the group</Button>}>
            Nobody in {g.name} owes anything right now.
          </EmptyState>
        ) : (
          <>
            {youPay.length > 0 && (
              <section>
                <SectionHeader title="You pay" />
                <List>
                  {youPay.map((p) => (
                    <PlanRow key={`${p.from_member_id}-${p.to_member_id}`} p={p} people={people} onClick={() => setSelected(p)} action="Pay" />
                  ))}
                </List>
              </section>
            )}
            {youGet.length > 0 && (
              <section>
                <SectionHeader title="You get" />
                <List>
                  {youGet.map((p) => (
                    <PlanRow key={`${p.from_member_id}-${p.to_member_id}`} p={p} people={people} onClick={() => setSelected(p)} action="Open" />
                  ))}
                </List>
              </section>
            )}
            {others.length > 0 && (
              <section>
                <SectionHeader title="Between others" />
                <List>
                  {others.map((p) => (
                    <PlanRow key={`${p.from_member_id}-${p.to_member_id}`} p={p} people={people} onClick={isAdmin ? () => setSelected(p) : undefined} muted />
                  ))}
                </List>
                {!isAdmin && <p className="mt-2 px-1 text-[13px] text-ink-3">Only the two people involved (or an admin) can mark these as paid.</p>}
              </section>
            )}
            <WhyThese pairwise={g.balances.pairwise} plan={plan} people={people} />
          </>
        )}
      </Content>
      <SettleSheet payment={selected} group={g} people={people} me={user} onClose={() => setSelected(null)} />
    </Page>
  );
}

function PlanRow({ p, people, onClick, action, muted }) {
  return (
    <Row
      onClick={onClick}
      leading={
        <span className="flex items-center">
          <Avatar user={people.get(p.from_member_id)} size="sm" />
          <Icon name="arrowRight" size={15} strokeWidth={2.2} className="mx-0.5 text-ink-3" />
          <Avatar user={people.get(p.to_member_id)} size="sm" />
        </span>
      }
      title={`${people.first(p.from_member_id)} ${p.from_member_id === people.meId ? 'pay' : 'pays'} ${people.first(p.to_member_id, true)}`}
      trailing={
        <span className="flex items-center gap-3">
          <span className={cn('text-[17px] font-semibold tabular-nums', muted && 'text-ink-2')}>{formatINR(p.amount_paise)}</span>
          {action && (
            <span className="hidden rounded-[10px] bg-accent-soft px-3 py-1.5 text-[14px] font-semibold text-accent-text sm:inline">{action}</span>
          )}
        </span>
      }
      chevron={Boolean(onClick)}
    />
  );
}

/** Answers the common confusion: "why do I pay someone I never borrowed from?" */
function WhyThese({ pairwise, plan, people }) {
  return (
    <details className="group mt-8 rounded-2xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-4 [&::-webkit-details-marker]:hidden">
        <Tile icon="info" tone="tone-accent" size="sm" />
        <span className="flex-1 text-[15.5px] font-medium">Why these payments?</span>
        <Icon name="chevronDown" size={18} className="text-ink-3 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 text-[15px] leading-relaxed text-ink-2">
        <p>
          Hisaab adds up everything in the group and combines debts, so fewer payments are needed. You might pay someone you never borrowed from
          directly. The total you pay stays the same.
        </p>
        {pairwise.length > plan.length && (
          <>
            <p className="mt-4 font-medium text-ink">
              Without combining, it would take {pairwise.length} payments instead of {plan.length}:
            </p>
            <ul className="mt-2 space-y-1.5">
              {pairwise.map((d) => (
                <li key={`${d.from_member_id}-${d.to_member_id}`} className="flex justify-between gap-3 text-[14.5px]">
                  <span>
                    {people.first(d.from_member_id)} owes {people.first(d.to_member_id, true)}
                  </span>
                  <span className="tabular-nums">{formatINR(d.amount_paise)}</span>
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
function SettleSheet({ payment, group, people, me, onClose }) {
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
      const msg = iGet ? `Marked ${formatINR(amount)} from ${people.first(p.from_member_id)} as received` : `Marked ${formatINR(amount)} to ${people.first(p.to_member_id, true)} as paid`;
      toast(msg, { action: { label: 'Undo', onClick: () => api.deleteSettlement(created.id) } });
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
        <div className="pb-1 text-center">
          <p className="text-[15.5px] leading-relaxed text-ink-2">
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
          <div className="flex items-center justify-center gap-4 pt-2 pb-5">
            <PersonBadge user={from} label={people.first(p.from_member_id)} />
            <span className="mb-6 flex items-center text-ink-3">
              <span className="h-px w-6 bg-line-strong" />
              <Icon name="arrowRight" size={20} strokeWidth={2} className="-ml-1" />
            </span>
            <PersonBadge user={to} label={people.first(p.to_member_id)} />
          </div>

          <label className="block text-center">
            <span className="text-[13px] font-medium text-ink-3">Amount</span>
            <span className="mt-1 flex items-baseline justify-center">
              <span className="mr-0.5 text-[26px] font-semibold text-ink-2">₹</span>
              <input
                inputMode="decimal"
                value={amountText}
                onChange={(e) => setAmountText(formatAmountInput(e.target.value))}
                aria-label="Amount to pay"
                style={{ width: amountWidth(amountText) }}
                className="max-w-[70vw] rounded-lg bg-transparent text-center text-[40px] font-bold tracking-[-0.035em] tabular-nums caret-accent outline-none focus-visible:bg-sunken focus-visible:outline-none"
              />
            </span>
          </label>
          <p className={cn('mt-1 text-center text-[13.5px]', tooMuch ? 'text-owe' : 'text-ink-3')}>
            {tooMuch ? `That is more than the ${formatINR(p.amount_paise)} owed.` : 'You can change it to pay part of it.'}
          </p>

          <div className="mt-6 grid gap-2">
            {iPay && to.upi_id && mobile && (
              <>
                <Button size="lg" full disabled={!amount} onClick={openUpi} icon={<Icon name="smartphone" size={20} />}>
                  Pay {formatINR(amount)} with UPI
                </Button>
                <p className="pb-1 text-center text-[13px] text-ink-3">Opens GPay, PhonePe, Paytm or any UPI app.</p>
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
              <p className="rounded-xl bg-sunken px-3.5 py-3 text-[14.5px] leading-snug text-ink-2">
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
                <Button variant="secondary" size="lg" full onClick={remind} icon={<Icon name="bell" size={19} />}>
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

function PersonBadge({ user, label }) {
  return (
    <span className="flex w-20 flex-col items-center gap-1.5">
      <Avatar user={user} size="lg" />
      <span className="max-w-full truncate text-[14px] font-medium">{label}</span>
    </span>
  );
}

function UpiBox({ upiId }) {
  const toast = useToast();
  return (
    <div className="mb-2 rounded-2xl border border-line bg-surface/70 p-3.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium text-ink-3">UPI ID</p>
          <p className="truncate font-mono text-[15px]">{upiId}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Icon name="copy" size={16} />} onClick={async () => (await copyText(upiId)) && toast('UPI ID copied', { icon: 'copy' })}>
          Copy
        </Button>
      </div>
      <p className="mt-2.5 flex gap-2 border-t border-line pt-2.5 text-[13px] leading-snug text-ink-2">
        <Icon name="smartphone" size={16} className="mt-0.5 shrink-0 text-ink-3" />
        UPI apps open only on phones. Pay from your phone with this ID, or open Hisaab on your phone for one-tap pay.
      </p>
    </div>
  );
}
