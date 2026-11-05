import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { api, gql } from '../api';
import { INVITE_PREVIEW } from '../api/queries';
import { useApi } from '../hooks/useApi';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { kindById } from '../lib/categories';
import { cn } from '../lib/cn';
import { timeLeft } from '../lib/dates';
import { AuthFrame } from '../components/AuthFrame';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { FormError } from '../components/ui/Field';
import { Skeleton } from '../components/ui/Skeleton';
import { Tile } from '../components/ui/Tile';

/**
 * Opened from an invite link: /join/<token>  (a personal link adds ?as=<member id>).
 * If friends were added to the group by name, it asks "Which one are you?" so the new person
 * takes over everything already recorded under that name.
 */
export default function JoinPage() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  // Reading the invite is GraphQL; joining is a REST write.
  const invite = useApi(() => gql(INVITE_PREVIEW, { token }), [token]);
  const [choice, setChoice] = useState(null); // a member id, or 'new'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useTitle('Join a group');
  const inv = invite.data?.invite;
  const open = inv?.open_members || [];

  // A personal link (?as=12) picks that name for you, if it is still free.
  useEffect(() => {
    const as = Number(params.get('as'));
    if (as && open.some((m) => m.id === as)) setChoice(as);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv]);

  async function join() {
    setBusy(true);
    setError('');
    try {
      const { group_id } = await api.joinInvite(token, typeof choice === 'number' ? choice : null);
      toast(`You joined ${inv.group.name}`, { icon: 'userPlus' });
      navigate(`/groups/${group_id}`, { replace: true });
    } catch (err) {
      setError(err.detail || err.message);
      setChoice(null);
      setBusy(false);
    }
  }

  if (invite.error && !inv) {
    return (
      <AuthFrame>
        <EmptyState icon="link" tone="tone-n" title="This invite link doesn't work" className="px-0" action={<Button to="/">Go to my groups</Button>}>
          It may have been replaced by a newer link. Ask your friend to send the link again.
        </EmptyState>
      </AuthFrame>
    );
  }
  if (!inv) {
    return (
      <AuthFrame>
        <Card className="p-6" aria-busy="true">
          <Skeleton className="size-14 rounded-2xl" />
          <Skeleton className="mt-5 h-4 w-40" />
          <Skeleton className="mt-3 h-8 w-56" />
          <Skeleton className="mt-8 h-[52px] w-full rounded-[14px]" />
        </Card>
      </AuthFrame>
    );
  }

  const inviter = inv.invited_by.name.split(' ')[0];
  if (inv.status === 'expired') {
    return (
      <AuthFrame>
        <EmptyState icon="clock" tone="tone-5" title="This invite link has expired" className="px-0" action={<Button to="/">Go to my groups</Button>}>
          Invite links work for 24 hours. Ask {inviter} for a new link to {inv.group.name}.
        </EmptyState>
      </AuthFrame>
    );
  }
  if (inv.status === 'member') {
    return (
      <AuthFrame>
        <EmptyState icon="checkCircle" tone="tone-2" title={`You're already in ${inv.group.name}`} className="px-0" action={<Button to={`/groups/${inv.group.id}`}>Open the group</Button>} />
      </AuthFrame>
    );
  }

  const kind = kindById(inv.group.kind);
  const picked = open.find((m) => m.id === choice);
  const mustPick = open.length > 0 && choice === null;
  return (
    <AuthFrame>
      <Card className="p-6">
        <Tile icon={kind.icon} tone={kind.tone} size="lg" />
        <p className="mt-5 text-[15px] text-ink-2">{inviter} invited you to join</p>
        <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-[-0.025em]">{inv.group.name}</h1>
        <div className="mt-4 flex items-center gap-2.5 text-[14.5px] text-ink-2">
          <AvatarStack users={inv.group.members_preview} size="sm" max={5} />
          {inv.group.member_count} {inv.group.member_count === 1 ? 'person' : 'people'}
        </div>

        {open.length > 0 && (
          <fieldset className="mt-7">
            <legend className="text-[16px] font-semibold">Which one are you?</legend>
            <p className="mt-1 text-[14px] leading-snug text-ink-2">{inviter} already added some people by name. Pick yours and everything recorded for you becomes yours.</p>
            <div className="mt-3 space-y-2" role="radiogroup">
              {[...open, { id: 'new', name: `I'm not on this list` }].map((m) => {
                const on = choice === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setChoice(m.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[border-color,transform] active:scale-[0.99]',
                      on ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-line hover:border-line-strong',
                    )}
                  >
                    {m.id === 'new' ? <Avatar user={user} size="sm" /> : <Avatar user={m} size="sm" pending />}
                    <span className="flex-1 text-[15.5px]">{m.name}</span>
                    <span className={cn('grid size-5 place-items-center rounded-full border-2', on ? 'border-accent bg-accent' : 'border-line-strong')}>
                      {on && <span className="size-2 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="mt-7 space-y-3">
          <FormError>{error}</FormError>
          <Button size="lg" full loading={busy} disabled={mustPick} onClick={join}>
            {mustPick ? 'Pick your name first' : picked ? `Join as ${picked.name}` : `Join ${inv.group.name}`}
          </Button>
          <p className="text-center text-[13px] text-ink-3">This link expires in {timeLeft(inv.expires_at)}.</p>
        </div>
      </Card>
    </AuthFrame>
  );
}
