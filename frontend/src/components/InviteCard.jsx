import { useState } from 'react';
import { api } from '../api';
import { useApi } from '../hooks/useApi';
import { useNow } from '../hooks/useNow';
import { useToast } from '../context/ToastContext';
import { timeLeft } from '../lib/dates';
import { copyText, shareOrFalse } from '../lib/feedback';
import { Icon } from './Icon';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { Tile } from './ui/Tile';

/** The group's invite link: share, copy, see when it expires; admins can replace it. */
export function InviteCard({ groupId, groupName, isAdmin, headline }) {
  const toast = useToast();
  useNow(30_000);
  const invite = useApi(() => api.getInvite(groupId), [groupId]);
  const [resetting, setResetting] = useState(false);
  const url = invite.data ? `${window.location.origin}/join/${invite.data.token}` : '';
  const left = invite.data && timeLeft(invite.data.expires_at);

  async function share() {
    const shared = await shareOrFalse({ title: `Join ${groupName} on Hisaab`, text: `Join "${groupName}" on Hisaab so we can split expenses.`, url });
    if (!shared) copy();
  }
  async function copy() {
    if (await copyText(url)) toast('Invite link copied', { icon: 'copy' });
  }
  async function reset() {
    setResetting(true);
    try {
      await api.resetInvite(groupId);
      toast('New link made. The old one no longer works.', { icon: 'link' });
    } finally {
      setResetting(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Tile icon="userPlus" tone="tone-accent" size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold">{headline || 'Invite link'}</h3>
          <p className="mt-0.5 text-[14px] text-ink-2">Anyone with the link can join. It works for 24 hours.</p>
        </div>
      </div>
      <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-line bg-surface-2 py-2 pr-2 pl-3">
        <Icon name="link" size={16} className="shrink-0 text-ink-3" />
        {invite.data ? (
          <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink-2">{url.replace(/^https?:\/\//, '')}</span>
        ) : (
          <Skeleton className="h-3.5 flex-1" />
        )}
      </div>
      <p className="mt-2 flex items-center gap-1.5 px-0.5 text-[13px] text-ink-3">
        <Icon name="clock" size={14} />
        {left ? `Expires in ${left}` : 'Making a link…'}
      </p>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={share} disabled={!invite.data} icon={<Icon name="share" size={18} />}>
          Share
        </Button>
        <Button variant="secondary" onClick={copy} disabled={!invite.data} icon={<Icon name="copy" size={18} />}>
          Copy link
        </Button>
      </div>
      {isAdmin && (
        <button
          type="button"
          onClick={reset}
          disabled={resetting}
          className="mt-3 flex items-center gap-1.5 rounded-lg px-0.5 text-[13.5px] font-medium text-ink-2 hover:text-ink disabled:opacity-50"
        >
          <Icon name="refresh" size={14} />
          {resetting ? 'Making a new link…' : 'Make a new link (the old one stops working)'}
        </button>
      )}
    </Card>
  );
}
