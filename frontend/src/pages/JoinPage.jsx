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
import { Icon } from '../components/Icon';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { FormError } from '../components/ui/Field';
import { Skeleton } from '../components/ui/Skeleton';

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
        <EmptyState title="This invite link doesn't work" className="mt-10" action={<Button to="/">Go to my groups</Button>}>
          It may have been replaced by a newer link. Ask your friend to send the link again.
        </EmptyState>
      </AuthFrame>
    );
  }
  if (!inv) {
    return (
      <AuthFrame>
        <div className="mt-10" aria-busy="true">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-3 h-8 w-44" />
          <Skeleton className="mt-4 h-4 w-40" />
          <Skeleton className="mt-10 h-14 w-full rounded-xl" />
        </div>
      </AuthFrame>
    );
  }

  const inviter = inv.invited_by.name.split(' ')[0];
  if (inv.status === 'expired') {
    return (
      <AuthFrame>
        <EmptyState title="This invite link has expired" className="mt-10" action={<Button to="/">Go to my groups</Button>}>
          Invite links work for 24 hours. Ask {inviter} for a new link to {inv.group.name}.
        </EmptyState>
      </AuthFrame>
    );
  }
  if (inv.status === 'member') {
    return (
      <AuthFrame>
        <EmptyState title={`You're already in ${inv.group.name}`} className="mt-10" action={<Button to={`/groups/${inv.group.id}`}>Open the group</Button>} />
      </AuthFrame>
    );
  }

  const kind = kindById(inv.group.kind);
  const picked = open.find((m) => m.id === choice);
  const mustPick = open.length > 0 && choice === null;
  return (
    <AuthFrame>
      <h1 className="mt-10 font-display text-[28px] leading-[38px] text-balance">
        {inviter} invited you to {inv.group.name}
      </h1>
      <div className="mt-3 flex items-center gap-2.5 text-[15px] text-ink-2">
        <AvatarStack users={inv.group.members_preview} size="sm" max={5} />
        <span className="pt-0.5">
          {inv.group.member_count} {inv.group.member_count === 1 ? 'person' : 'people'} · {kind.label}
        </span>
      </div>

      {open.length > 0 && (
        <fieldset className="mt-9">
          <legend className="pt-0.5 text-[20px] leading-tight font-bold">Which one are you?</legend>
          <p className="mt-1.5 text-[15px] leading-snug text-ink-2">{inviter} already added some people by name. Pick yours and everything recorded for you becomes yours.</p>
          <div className="mt-4 divide-y divide-line border-y border-line" role="radiogroup">
            {[...open, { id: 'new', name: `I'm not on this list` }].map((m) => {
              const on = choice === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setChoice(m.id)}
                  className="flex min-h-14 w-full items-center gap-3 px-1 py-2.5 text-left hover:bg-surface-2 active:bg-sunken"
                >
                  {m.id === 'new' ? <Avatar user={user} size="sm" me /> : <Avatar user={m} size="sm" pending />}
                  <span className={cn('min-w-0 flex-1 truncate pt-0.5 text-[17px] leading-6 text-ink', on && 'font-semibold')}>{m.name}</span>
                  <span className="grid size-6 shrink-0 place-items-center text-accent-text">{on && <Icon name="check" size={20} strokeWidth={2.4} />}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-8 space-y-3">
        <FormError>{error}</FormError>
        <Button size="lg" full loading={busy} disabled={mustPick} onClick={join}>
          {mustPick ? 'Pick your name first' : picked ? `Join as ${picked.name}` : `Join ${inv.group.name}`}
        </Button>
        <p className="text-[14px] text-ink-2">This link expires in {timeLeft(inv.expires_at)}.</p>
      </div>
    </AuthFrame>
  );
}
