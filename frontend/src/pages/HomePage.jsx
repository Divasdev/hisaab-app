import { useState } from 'react';
import { api } from '../api';
import { Link, useNavigate } from 'react-router';
import { gql } from '../api';
import { HOME_SCREEN } from '../api/queries';
import { useApi } from '../hooks/useApi';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import { formatINR } from '../lib/money';
import { kindById } from '../lib/categories';
import { useToast } from '../context/ToastContext';
import { Tile } from '../components/ui/Tile';
import { Icon } from '../components/Icon';
import { ActivityItem } from '../components/ActivityItem';
import { GroupRow } from '../components/GroupRow';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, List, SectionHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { BottomBar, Content, LargeTitle, Page, TopBar } from '../components/ui/Page';
import { Sheet } from '../components/ui/Sheet';
import { ListSkeleton, Skeleton } from '../components/ui/Skeleton';

export default function HomePage() {
  useTitle('Groups');
  const { user } = useAuth();
  const navigate = useNavigate();
  // One GraphQL query gives this screen everything it shows.
  const home = useApi(() => gql(HOME_SCREEN), []);
  const [picking, setPicking] = useState(false);
  const list = home.data?.groups;
  const none = list && list.length === 0;

  // The most common job is adding an expense, so that is the big bottom button.
  function addExpense() {
    if (!list?.length) return navigate('/groups/new');
    if (list.length === 1) return navigate(`/groups/${list[0].id}/add`);
    setPicking(true);
  }

  return (
    <Page>
      <TopBar
        title="Groups"
        right={
          <Link to="/account" aria-label="Account" className="rounded-full transition-transform active:scale-95 lg:hidden">
            <Avatar user={user} size="sm" />
          </Link>
        }
      />
      <Content>
        <p className="px-1 text-[15px] text-ink-2">Hi, {user?.name.split(' ')[0]}</p>
        <LargeTitle>
          <span className="lg:hidden">Your groups</span>
          <span className="hidden lg:inline">Overview</span>
        </LargeTitle>

        <PendingInvites invites={home.data?.my_invites} />
        {!none && <OverallCard data={home.data?.my_balance} />}

        {none ? (
          <EmptyState
            icon="users"
            title="No groups yet"
            className="mt-6"
            action={
              <Button size="lg" to="/groups/new" icon={<Icon name="plus" />}>
                Create a group
              </Button>
            }
          >
            Make one for your hostel room, your flat or your next trip. Then share the invite link with your friends.
          </EmptyState>
        ) : (
          <>
            <section className="lg:hidden" aria-labelledby="groups-h">
              <SectionHeader
                id="groups-h"
                title="Groups"
                action={
                  <Button variant="ghost" size="sm" to="/groups/new" icon={<Icon name="plus" size={17} />} className="-mr-2 text-accent-text">
                    New group
                  </Button>
                }
              />
              {!list ? (
                <ListSkeleton rows={3} />
              ) : (
                <List>
                  {list.map((g) => (
                    <GroupRow key={g.id} group={g} to={`/groups/${g.id}`} />
                  ))}
                </List>
              )}
            </section>
            <section className="hidden lg:block" aria-labelledby="recent-h">
              <SectionHeader id="recent-h" title="Recent activity" />
              {!home.data ? (
                <ListSkeleton rows={5} />
              ) : (
                <List>
                  {home.data.recent_activity.map((a) => (
                    <ActivityItem key={a.id} item={a} meId={user.id} showGroup />
                  ))}
                </List>
              )}
            </section>
          </>
        )}
      </Content>

      {!none && (
        <BottomBar>
          <Button size="lg" full icon={<Icon name="plus" size={21} strokeWidth={2.2} />} onClick={addExpense} disabled={!list}>
            Add expense
          </Button>
        </BottomBar>
      )}

      <Sheet open={picking} onClose={() => setPicking(false)} title="Add an expense to…" description="Pick the group it belongs to.">
        <List className="bg-surface/70">
          {list?.map((g) => (
            <GroupRow key={g.id} group={g} onClick={() => navigate(`/groups/${g.id}/add`)} />
          ))}
        </List>
      </Sheet>
    </Page>
  );
}

/** Someone added you to a group using your email: join it, or say "Not me". */
function PendingInvites({ invites }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  if (!invites?.length) return null;

  async function answer(inv, accept) {
    setBusy(`${inv.member_id}-${accept}`);
    try {
      if (accept) {
        const { group_id } = await api.acceptInvite(inv.member_id);
        toast(`You joined ${inv.group.name}`, { icon: 'userPlus' });
        navigate(`/groups/${group_id}`);
      } else {
        await api.declineInvite(inv.member_id);
        toast('Invite removed', { icon: 'x' });
      }
    } catch (err) {
      toast(err.detail || err.message, { icon: 'info' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-label="Invites" className="mt-5 space-y-3">
      {invites.map((inv) => {
        const kind = kindById(inv.group.kind);
        return (
          <Card key={inv.member_id} className="border-accent/30 bg-accent-soft/40 p-4">
            <div className="flex items-start gap-3">
              <Tile icon={kind.icon} tone={kind.tone} />
              <div className="min-w-0 flex-1">
                <p className="text-[15.5px] leading-snug">
                  <b className="font-semibold">{inv.added_by.name.split(' ')[0]}</b> added you to <b className="font-semibold">{inv.group.name}</b>
                </p>
                <p className="mt-0.5 text-[13.5px] text-ink-2">
                  as “{inv.name}” · {inv.group.member_count} people
                </p>
              </div>
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <Button loading={busy === `${inv.member_id}-true`} disabled={Boolean(busy)} onClick={() => answer(inv, true)}>
                Join
              </Button>
              <Button variant="secondary" loading={busy === `${inv.member_id}-false`} disabled={Boolean(busy)} onClick={() => answer(inv, false)}>
                Not me
              </Button>
            </div>
          </Card>
        );
      })}
    </section>
  );
}

function OverallCard({ data }) {
  if (!data) {
    return (
      <Card className="mt-5 p-5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-10 w-44" />
        <Skeleton className="mt-6 h-12 w-full" />
      </Card>
    );
  }
  const net = data.net_paise;
  const tone = net > 0 ? 'text-owed' : net < 0 ? 'text-owe' : 'text-ink';
  return (
    <Card className="mt-5 overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <p className="text-[15px] text-ink-2">{net > 0 ? 'Overall, you get back' : net < 0 ? 'Overall, you owe' : 'Overall'}</p>
        <p className={cn('mt-1 text-[40px] leading-none font-bold tracking-[-0.035em] tabular-nums', tone)}>
          {net === 0 ? 'All settled up' : formatINR(net)}
        </p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-line border-t border-line">
        <Stat icon="arrowUpRight" tone="text-owe" label="You owe" paise={data.i_owe_paise} groups={data.groups_owe} />
        <Stat icon="arrowDownLeft" tone="text-owed" label="You get back" paise={data.owed_to_me_paise} groups={data.groups_owed} />
      </div>
    </Card>
  );
}

function Stat({ icon, tone, label, paise, groups }) {
  return (
    <div className="px-5 py-3.5">
      <p className={cn('flex items-center gap-1 text-[13px] font-medium', paise ? tone : 'text-ink-3')}>
        <Icon name={icon} size={14} strokeWidth={2.2} />
        {label}
      </p>
      <p className="mt-0.5 text-[19px] font-semibold tracking-[-0.01em] tabular-nums">{formatINR(paise)}</p>
      <p className="text-[12.5px] text-ink-3">{groups ? `in ${groups} ${groups === 1 ? 'group' : 'groups'}` : 'nothing'}</p>
    </div>
  );
}
