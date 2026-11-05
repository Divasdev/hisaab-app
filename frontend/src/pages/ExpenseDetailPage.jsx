import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { api, gql } from '../api';
import { EXPENSE_SCREEN } from '../api/queries';
import { useApi } from '../hooks/useApi';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { categoryById } from '../lib/categories';
import { cn } from '../lib/cn';
import { prefersReducedMotion } from '../lib/spring';
import { dayLabel, timeAgo } from '../lib/dates';
import { formatINR } from '../lib/money';
import { peopleOf } from '../lib/people';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, List, Row, SectionHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Content, LargeTitle, Page, TopBar } from '../components/ui/Page';
import { ListSkeleton, Skeleton } from '../components/ui/Skeleton';
import { Tile } from '../components/ui/Tile';

const SPLIT_WORD = { equal: 'equally', exact: 'by amounts', shares: 'by shares' };

/** "today", "yesterday", or "on Mon, 26 Oct", to finish the sentence "Paid by you …". */
function onDay(iso) {
  const day = dayLabel(iso);
  return day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : `on ${day}`;
}

export default function ExpenseDetailPage() {
  const { groupId, expenseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  // One GraphQL query: the expense, and its group reached through the expense.
  const expense = useApi(() => gql(EXPENSE_SCREEN, { id: Number(expenseId) }), [expenseId]);
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const e = expense.data?.expense;
  const g = e?.group;
  const people = useMemo(() => peopleOf(g), [g]);
  useTitle(e?.description);
  const backTo = `/groups/${groupId}`;

  // Delete straight away, then offer Undo. No "Are you sure?" dialog for something that can be undone.
  async function remove() {
    setBusy(true);
    try {
      await api.deleteExpense(e.id);
      // The signature mark: one line is drawn through the expense, then the screen closes and Undo is offered.
      setDeleted(true);
      await new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 0 : 420));
      navigate(backTo, { replace: true });
      toast(`Deleted “${e.description}”`, { icon: 'trash', action: { label: 'Undo', onClick: () => api.restoreExpense(e.id) } });
    } catch (err) {
      toast(err.detail || err.message, { icon: 'info' });
      setBusy(false);
    }
  }

  if (expense.error && !e) {
    return (
      <Page>
        <TopBar back={backTo} backLabel="Back" />
        <Content>
          <EmptyState title="This expense is gone" className="mt-4" action={<Button to={backTo}>Back to the group</Button>}>
            {expense.error.detail || 'It may have been deleted by someone in the group.'}
          </EmptyState>
        </Content>
      </Page>
    );
  }

  // The URL's group must be the expense's group; otherwise go to the right address.
  if (e && e.group_id !== Number(groupId)) return <Navigate to={`/groups/${e.group_id}/expenses/${e.id}`} replace />;

  const cat = categoryById(e?.category);
  const ready = Boolean(e);
  return (
    <Page>
      <TopBar
        back={backTo}
        backLabel={g?.name || 'Back'}
        title={e?.description}
        right={
          ready && (
            <Button variant="secondary" size="sm" to={`/groups/${groupId}/expenses/${e.id}/edit`} icon={<Icon name="pencil" size={15} />}>
              Edit
            </Button>
          )
        }
      />
      <Content>
        {!ready ? (
          <div className="pt-2" aria-busy="true">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="mt-3 h-6 w-16" />
            <Skeleton className="mt-8 h-14 w-48" />
            <Skeleton className="mt-5 h-4 w-56" />
            <Skeleton className="mt-12 mb-4 h-5 w-44" />
            <ListSkeleton rows={3} />
          </div>
        ) : (
          <>
            <LargeTitle className={cn('break-words', deleted && 'struck text-ink-2')}>{e.description}</LargeTitle>
            <div className="mt-2">
              <Tile label={cat.label} />
            </div>

            {/* The amount, written like a total at the bottom of a page. */}
            <section aria-label="Amount" className="mt-7">
              <p className="tabular font-display text-[44px] leading-[1.15] break-words text-accent-text min-[380px]:text-[52px]">
                <span className={cn('relative inline-block double-underline', deleted && 'strike-draw')}>{formatINR(e.amount_paise)}</span>
              </p>
              <p className="mt-4 text-[16px] leading-6 text-ink-2">
                Paid by <span className="font-semibold text-ink">{people.name(e.paid_by, true)}</span> {onDay(e.date)}
              </p>
            </section>

            <section aria-labelledby="split-h">
              <SectionHeader id="split-h" title={`Split ${SPLIT_WORD[e.split_type]} between ${e.splits.length}`} />
              <List>
                {e.splits.map((s) => {
                  const isMe = s.member_id === people.meId;
                  const isPayer = s.member_id === e.paid_by;
                  const sub = isPayer
                    ? `${isMe ? 'Your' : 'Their'} own share`
                    : `${isMe ? 'You owe' : 'Owes'} ${people.first(e.paid_by, true)}`;
                  return (
                    <Row
                      key={s.member_id}
                      leading={<Avatar user={people.get(s.member_id)} size="sm" me={isMe} />}
                      title={people.name(s.member_id)}
                      subtitle={s.shares ? `${sub} · ${s.shares} ${s.shares === 1 ? 'share' : 'shares'}` : sub}
                      trailing={
                        <span className={cn('tabular shrink-0 text-[17px] font-semibold', isMe && !isPayer && 'text-owe')}>{formatINR(s.amount_paise, { exact: true })}</span>
                      }
                    />
                  );
                })}
              </List>
            </section>

            {e.note && (
              <Card className="mt-8">
                <p className="text-[14px] font-semibold text-ink-2">Note</p>
                <p className="mt-1 text-[16px] leading-relaxed whitespace-pre-wrap">{e.note}</p>
              </Card>
            )}

            <p className="mt-6 text-[14px] text-ink-2">
              Added by {e.creator.id === user.id ? 'you' : e.creator.name.split(' ')[0]} {timeAgo(e.created_at)}
              {e.updated_at !== e.created_at && ` · edited ${timeAgo(e.updated_at)}`}
            </p>

            {/* Delete sits on its own, far from Edit (top right), so it is never hit by mistake. It can be undone. */}
            <div className="mt-14">
              <Button variant="danger" loading={busy} onClick={remove} icon={<Icon name="trash" size={18} />}>
                Delete expense
              </Button>
            </div>
          </>
        )}
      </Content>
    </Page>
  );
}
