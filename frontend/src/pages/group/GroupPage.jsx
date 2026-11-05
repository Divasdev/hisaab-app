import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { gql } from '../../api';
import { GROUP_SCREEN } from '../../api/queries';
import { useApi } from '../../hooks/useApi';
import { useTitle } from '../../hooks/useTitle';
import { useAuth } from '../../context/AuthContext';
import { kindById } from '../../lib/categories';
import { cn } from '../../lib/cn';
import { formatINR } from '../../lib/money';
import { listNames, peopleOf } from '../../lib/people';
import { Icon } from '../../components/Icon';
import { InviteCard } from '../../components/InviteCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BigTotal } from '../../components/ui/Money';
import { BottomBar, Content, ErrorPage, LargeTitle, Page, TopBar } from '../../components/ui/Page';
import { Segmented } from '../../components/ui/Segmented';
import { Skeleton } from '../../components/ui/Skeleton';
import { ExpensesTab } from './ExpensesTab';
import { BalancesTab } from './BalancesTab';
import { ActivityTab } from './ActivityTab';

const TABS = [
  { value: 'expenses', label: 'Expenses' },
  { value: 'balances', label: 'Balances' },
  { value: 'activity', label: 'Activity' },
];

export default function GroupPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'expenses';
  // Header, members, expenses and payments come from one GraphQL query.
  const group = useApi(() => gql(GROUP_SCREEN, { id: Number(groupId) }), [groupId]);
  const g = group.data?.group;
  const people = useMemo(() => peopleOf(g), [g]);
  const meId = g?.my_member_id;
  useTitle(g?.name);

  if (group.error && !g) return <ErrorPage error={group.error} />;

  const kind = kindById(g?.kind);
  return (
    <Page>
      <TopBar title={g?.name} back="/" backLabel="Groups" />
      <Content>
        {!g ? (
          <HeaderSkeleton />
        ) : (
          <>
            <LargeTitle>{g.name}</LargeTitle>
            <p className="mt-1 text-[16px] leading-[22px] text-ink-2">
              {kind.label} · {g.members.length} {g.members.length === 1 ? 'member' : 'members'}
            </p>
            <Summary g={g} />
            <JoinNudge g={g} />
          </>
        )}

        <Segmented
          className="mt-8"
          label="Group sections"
          idPrefix="group"
          options={TABS}
          value={tab}
          onChange={(t) => setParams(t === 'expenses' ? {} : { tab: t }, { replace: true })}
        />
        <div id="group-panel" role="tabpanel" aria-labelledby={`group-tab-${tab}`}>
          {tab === 'expenses' && <ExpensesTab groupId={groupId} expenses={g?.expenses} payments={g?.settlements} people={people} meId={meId} />}
          {tab === 'balances' && g && <BalancesTab group={g} people={people} meId={meId} />}
          {tab === 'activity' && <ActivityTab groupId={groupId} meId={user.id} />}
        </div>
      </Content>
      <BottomBar desktop={false}>
        <Button size="lg" full to={`/groups/${groupId}/add`} icon={<Icon name="plus" size={18} />}>
          Add expense
        </Button>
      </BottomBar>
    </Page>
  );
}

/** Your balance in this group, written as the total at the bottom of the page, with the group's actions under it. */
function Summary({ g }) {
  const b = g.my_balance_paise;
  const anyoneOwes = g.members.some((m) => m.balance_paise !== 0);
  const lead = b > 0 ? 'You get back in this group' : b < 0 ? 'You owe in this group' : 'Your balance in this group';
  return (
    <section aria-label="Your balance in this group" className="mt-7">
      {/* Settled is words, not a figure: the smaller size keeps it on one line on small phones. */}
      <BigTotal paise={b} lead={lead} settledText="All settled up" size={b ? 'lg' : 'md'} />
      <p className="mt-5 text-[15px] leading-6 text-ink-2">
        Group spent <b className="tabular font-semibold text-ink">{formatINR(g.total_spent_paise)}</b> in total
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* On laptops the main action sits here instead of in a bar stretched across the bottom. */}
        <Button size="sm" to={`/groups/${g.id}/add`} icon={<Icon name="plus" size={15} />} className="max-lg:hidden">
          Add expense
        </Button>
        {anyoneOwes && (
          <Button variant="secondary" size="sm" to={`/groups/${g.id}/settle`}>
            Settle up
          </Button>
        )}
        <Button variant="quiet" size="sm" to={`/groups/${g.id}/members`} className={cn(!anyoneOwes && '-ml-3.5 lg:ml-0')}>
          Members and invite
        </Button>
      </div>
    </section>
  );
}

/** Shown while friends added by name haven't joined, or when you are alone in the group. */
function JoinNudge({ g }) {
  const waiting = g.members.filter((m) => !m.joined);
  const alone = g.members.length === 1;
  if (alone) {
    return (
      <div className="mt-6">
        <InviteCard groupId={g.id} groupName={g.name} isAdmin={g.my_role === 'admin'} headline="Invite your group" />
        <Button variant="quiet" size="sm" to={`/groups/${g.id}/members?add=1`} className="mt-2 -ml-3.5">
          Or add people by name
        </Button>
      </div>
    );
  }
  if (!waiting.length) return null;
  return (
    <Card className="mt-6">
      <p className="text-[16px] leading-snug font-semibold">
        {listNames(waiting)} {waiting.length === 1 ? "hasn't" : "haven't"} joined yet
      </p>
      <p className="mt-1 text-[15px] leading-snug text-ink-2">You can already split with them. Invite them so they see it too.</p>
      <Button variant="secondary" size="sm" to={`/groups/${g.id}/members`} className="mt-3.5">
        Invite
      </Button>
    </Card>
  );
}

function HeaderSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="mt-2 h-8 w-3/5" />
      <Skeleton className="mt-3 h-4 w-1/3" />
      <Skeleton className="mt-9 h-4 w-44" />
      <Skeleton className="mt-3 h-12 w-56" />
      <Skeleton className="mt-6 h-4 w-52" />
    </div>
  );
}
