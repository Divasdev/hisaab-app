import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api, gql } from '../api';
import { HOME_SCREEN } from '../api/queries';
import { useApi } from '../hooks/useApi';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../lib/money';
import { useToast } from '../context/ToastContext';
import { Icon } from '../components/Icon';
import { ActivityItem } from '../components/ActivityItem';
import { GroupRow } from '../components/GroupRow';
import { Avatar } from '../components/ui/Avatar';
import { Wordmark } from '../components/ui/Brand';
import { Button } from '../components/ui/Button';
import { Card, List, SectionHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { BigTotal } from '../components/ui/Money';
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
        title="Your hisaab"
        left={
          <Link to="/" className="rounded-md px-2 pt-1 lg:hidden">
            <Wordmark />
          </Link>
        }
        right={
          <Link to="/account" aria-label="Account" className="rounded-lg lg:hidden">
            <Avatar user={user} size="md" me />
          </Link>
        }
      />
      <Content>
        <p className="pt-2 text-[16px] text-ink-2">Hi, {user?.name.split(' ')[0]}</p>
        <div className="flex items-end justify-between gap-4">
          <LargeTitle>Your hisaab</LargeTitle>
          {!none && (
            <Button className="mb-1 max-lg:hidden" icon={<Icon name="plus" size={16} />} onClick={addExpense} disabled={!list}>
              Add expense
            </Button>
          )}
        </div>

        {!none && <Overall data={home.data?.my_balance} />}
        <PendingInvites invites={home.data?.my_invites} />

        {none ? (
          <EmptyState
            title="No groups yet"
            className="mt-8"
            action={
              <Button size="lg" to="/groups/new" icon={<Icon name="plus" size={18} />}>
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
                  <Button variant="secondary" size="sm" to="/groups/new" icon={<Icon name="plus" size={15} />}>
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
        <BottomBar desktop={false}>
          <Button size="lg" full icon={<Icon name="plus" size={18} />} onClick={addExpense} disabled={!list}>
            Add expense
          </Button>
        </BottomBar>
      )}

      <Sheet open={picking} onClose={() => setPicking(false)} title="Add an expense to…" description="Pick the group it belongs to.">
        <List>
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
        toast(`You joined ${inv.group.name}`);
        navigate(`/groups/${group_id}`);
      } else {
        await api.declineInvite(inv.member_id);
        toast('Invite removed');
      }
    } catch (err) {
      toast(err.detail || err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-label="Invites" className="mt-8 space-y-3">
      {invites.map((inv) => (
        <Card key={inv.member_id}>
          <p className="text-[16px] leading-snug">
            <b className="font-semibold">{inv.added_by.name.split(' ')[0]}</b> added you to <b className="font-semibold">{inv.group.name}</b>
          </p>
          <p className="mt-0.5 text-[14px] text-ink-2">
            as “{inv.name}” · {inv.group.member_count} people
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button size="sm" loading={busy === `${inv.member_id}-true`} disabled={Boolean(busy)} onClick={() => answer(inv, true)}>
              Join
            </Button>
            <Button size="sm" variant="secondary" loading={busy === `${inv.member_id}-false`} disabled={Boolean(busy)} onClick={() => answer(inv, false)}>
              Not me
            </Button>
          </div>
        </Card>
      ))}
    </section>
  );
}

/** What you owe or get back across every group, written like the total at the bottom of a page. */
function Overall({ data }) {
  if (!data) {
    return (
      <div className="mt-7 space-y-3" aria-busy="true">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-4 w-52" />
      </div>
    );
  }
  const net = data.net_paise;
  const lead = net > 0 ? 'You get back, overall' : net < 0 ? 'You owe, overall' : 'Overall';
  return (
    <section aria-label="Overall balance" className="mt-7">
      <BigTotal paise={net} lead={lead} settledText="All settled up" />
      {(data.i_owe_paise !== 0 || data.owed_to_me_paise !== 0) && (
        <div className="mt-5 text-[15px] leading-6 text-ink-2">
          {data.i_owe_paise !== 0 && (
            <p>
              <b className="tabular font-semibold text-owe">{formatINR(data.i_owe_paise)}</b> to pay in {data.groups_owe}{' '}
              {data.groups_owe === 1 ? 'group' : 'groups'}
            </p>
          )}
          {data.owed_to_me_paise !== 0 && (
            <p>
              <b className="tabular font-semibold text-owed">{formatINR(data.owed_to_me_paise)}</b> to get back from {data.groups_owed}{' '}
              {data.groups_owed === 1 ? 'group' : 'groups'}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
