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
import { longDate, timeAgo } from '../lib/dates';
import { formatINR } from '../lib/money';
import { peopleOf } from '../lib/people';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, List, Row, SectionHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Content, Page, TopBar } from '../components/ui/Page';
import { Skeleton } from '../components/ui/Skeleton';
import { Tile } from '../components/ui/Tile';

const SPLIT_WORD = { equal: 'equally', exact: 'by amounts', shares: 'by shares' };

export default function ExpenseDetailPage() {
  const { groupId, expenseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  // One GraphQL query: the expense, and its group reached through the expense.
  const expense = useApi(() => gql(EXPENSE_SCREEN, { id: Number(expenseId) }), [expenseId]);
  const [busy, setBusy] = useState(false);
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
          <EmptyState icon="trash" tone="tone-n" title="This expense is gone" action={<Button to={backTo}>Back to the group</Button>}>
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
            <Button variant="ghost" size="sm" to={`/groups/${groupId}/expenses/${e.id}/edit`} className="text-[16px] text-accent-text" icon={<Icon name="pencil" size={16} />}>
              Edit
            </Button>
          )
        }
      />
      <Content>
        {!ready ? (
          <div className="flex flex-col items-center gap-4 pt-4" aria-busy="true">
            <Skeleton className="size-14 rounded-2xl" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-11 w-36" />
            <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center pt-2 text-center">
              <Tile icon={cat.icon} tone={cat.tone} size="lg" />
              <h1 className="mt-4 text-[22px] leading-tight font-semibold tracking-[-0.015em] text-balance">{e.description}</h1>
              <p className="mt-2 text-[46px] leading-none font-bold tracking-[-0.04em] tabular-nums">{formatINR(e.amount_paise)}</p>
              <p className="mt-3 text-[14.5px] text-ink-2">
                {longDate(e.date)} · {cat.label}
              </p>
            </div>

            <Card className="mt-7">
              <Row
                as="div"
                leading={<Avatar user={people.get(e.paid_by)} />}
                title={`${people.name(e.paid_by)} paid`}
                subtitle={e.paid_by === people.meId ? 'The others owe you' : `The others owe ${people.first(e.paid_by)}`}
                trailing={<span className="text-[17px] font-semibold tabular-nums">{formatINR(e.amount_paise)}</span>}
              />
            </Card>

            <SectionHeader title={`Split ${SPLIT_WORD[e.split_type]} between ${e.splits.length}`} />
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
                    leading={<Avatar user={people.get(s.member_id)} size="sm" />}
                    title={people.name(s.member_id)}
                    subtitle={s.shares ? `${sub} · ${s.shares} ${s.shares === 1 ? 'share' : 'shares'}` : sub}
                    trailing={
                      <span className={cn('text-[16px] font-semibold tabular-nums', isMe && !isPayer && 'text-owe')}>{formatINR(s.amount_paise)}</span>
                    }
                  />
                );
              })}
            </List>

            {e.note && (
              <Card className="mt-4 p-4">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3">
                  <Icon name="note" size={14} /> Note
                </p>
                <p className="mt-1 text-[15.5px] leading-relaxed whitespace-pre-wrap">{e.note}</p>
              </Card>
            )}

            <p className="mt-6 px-1 text-center text-[13px] text-ink-3">
              Added by {e.creator.id === user.id ? 'you' : e.creator.name.split(' ')[0]} {timeAgo(e.created_at)}
              {e.updated_at !== e.created_at && ` · edited ${timeAgo(e.updated_at)}`}
            </p>

            <Button variant="danger" size="lg" full className="mt-6" loading={busy} onClick={remove} icon={<Icon name="trash" size={19} />}>
              Delete expense
            </Button>
          </>
        )}
      </Content>
    </Page>
  );
}
