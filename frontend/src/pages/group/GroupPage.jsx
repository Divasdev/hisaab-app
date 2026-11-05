import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
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
import { AvatarStack } from '../../components/ui/Avatar';
import { Button, IconButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BottomBar, Content, ErrorPage, LargeTitle, Page, TopBar } from '../../components/ui/Page';
import { Segmented } from '../../components/ui/Segmented';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tile } from '../../components/ui/Tile';
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
      <TopBar
        title={g?.name}
        back="/"
        backLabel="Groups"
        right={
          <IconButton label="Members and settings" to={`/groups/${groupId}/members`}>
            <Icon name="users" size={21} />
          </IconButton>
        }
      />
      <Content>
        {!g ? (
          <HeaderSkeleton />
        ) : (
          <>
            <div className="flex items-start gap-3.5 px-1">
              <Tile icon={kind.icon} tone={kind.tone} size="lg" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <LargeTitle className="px-0 pt-0 text-[28px]">{g.name}</LargeTitle>
                <Link
                  to={`/groups/${groupId}/members`}
                  className="mt-1.5 inline-flex items-center gap-2 rounded-lg text-[14px] text-ink-2 hover:text-ink"
                >
                  <AvatarStack users={g.members} max={5} size="xs" />
                  {g.members.length} {g.members.length === 1 ? 'member' : 'members'}
                  <Icon name="chevronRight" size={15} />
                </Link>
              </div>
            </div>
            <SummaryCard g={g} />
            <JoinNudge g={g} />
          </>
        )}

        <Segmented
          className="mt-6"
          label="Group sections"
          idPrefix="group"
          options={TABS}
          value={tab}
          onChange={(t) => setParams(t === 'expenses' ? {} : { tab: t }, { replace: true })}
        />
        <div id="group-panel" role="tabpanel" aria-labelledby={`group-tab-${tab}`} className="mt-1">
          {tab === 'expenses' && <ExpensesTab groupId={groupId} expenses={g?.expenses} payments={g?.settlements} people={people} meId={meId} />}
          {tab === 'balances' && g && <BalancesTab group={g} people={people} meId={meId} />}
          {tab === 'activity' && <ActivityTab groupId={groupId} meId={user.id} />}
        </div>
      </Content>
      <BottomBar>
        <Button size="lg" full to={`/groups/${groupId}/add`} icon={<Icon name="plus" size={21} strokeWidth={2.2} />}>
          Add expense
        </Button>
      </BottomBar>
    </Page>
  );
}

/** Shown while friends added by name haven't joined, or when you are alone in the group. */
function JoinNudge({ g }) {
  const waiting = g.members.filter((m) => !m.joined);
  const alone = g.members.length === 1;
  if (alone) {
    return (
      <div className="mt-3 space-y-2">
        <InviteCard groupId={g.id} groupName={g.name} isAdmin={g.my_role === 'admin'} headline="Invite your group" />
        <Button variant="ghost" full to={`/groups/${g.id}/members?add=1`} icon={<Icon name="userPlus" size={18} />} className="text-accent-text">
          Or add people by name
        </Button>
      </div>
    );
  }
  if (!waiting.length) return null;
  return (
    <Card className="mt-3 flex items-center gap-3 py-3.5 pr-3.5 pl-4">
      <AvatarStack users={waiting} size="sm" max={3} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug font-medium">
          {listNames(waiting)} {waiting.length === 1 ? "hasn't" : "haven't"} joined yet
        </p>
        <p className="text-[13.5px] leading-snug text-ink-2">You can already split with them. Invite them so they see it too.</p>
      </div>
      <Button variant="tinted" size="sm" to={`/groups/${g.id}/members`}>
        Invite
      </Button>
    </Card>
  );
}

function SummaryCard({ g }) {
  const b = g.my_balance_paise;
  const tone = b > 0 ? 'text-owed' : b < 0 ? 'text-owe' : 'text-ink';
  const anyoneOwes = g.members.some((m) => m.balance_paise !== 0);
  return (
    <Card className="mt-5 flex items-center gap-4 py-4 pr-4 pl-5">
      <div className="min-w-0 flex-1">
        <p className={cn('flex items-center gap-1 text-[14px] font-medium', b ? tone : 'text-ink-2')}>
          {b !== 0 && <Icon name={b > 0 ? 'arrowDownLeft' : 'arrowUpRight'} size={15} strokeWidth={2.2} />}
          {b > 0 ? 'You get back' : b < 0 ? 'You owe' : 'Your balance'}
        </p>
        <p className={cn('mt-0.5 text-[30px] leading-tight font-bold tracking-[-0.03em] tabular-nums', tone)}>
          {b === 0 ? 'Settled up' : formatINR(b)}
        </p>
        <p className="mt-0.5 text-[13.5px] text-ink-3">Group spent {formatINR(g.total_spent_paise)} in total</p>
      </div>
      {anyoneOwes && (
        <Button variant="tinted" to={`/groups/${g.id}/settle`}>
          Settle up
        </Button>
      )}
    </Card>
  );
}

function HeaderSkeleton() {
  return (
    <div aria-busy="true">
      <div className="flex items-center gap-3.5 px-1">
        <Skeleton className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-7 w-3/5" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-5 h-[110px] w-full rounded-2xl" />
    </div>
  );
}
