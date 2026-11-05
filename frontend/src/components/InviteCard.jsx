import { useState } from 'react';
import { api } from '../api';
import { useApi } from '../hooks/useApi';
import { useNow } from '../hooks/useNow';
import { useToast } from '../context/ToastContext';
import { timeLeft } from '../lib/dates';
import { cn } from '../lib/cn';
import { copyText, shareOrFalse } from '../lib/feedback';
import { Icon } from './Icon';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { inputClass } from './ui/Field';
import { Skeleton } from './ui/Skeleton';

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

  // A note ruled off on its own: the link in a read-only field, when it runs out, and two ways to send it.
  return (
    <Card>
      {headline && <h3 className="pt-0.5 text-[17px] leading-6 font-semibold">{headline}</h3>}
      <p className="mt-0.5 text-[15px] leading-snug text-ink-2">Anyone with the link can join. It works for 24 hours.</p>
      <div className="mt-4">
        {invite.data ? (
          <input
            readOnly
            value={url.replace(/^https?:\/\//, '')}
            aria-label="Invite link"
            onFocus={(e) => e.target.select()}
            className={cn(inputClass, 'truncate text-[15px] text-ink-2')}
          />
        ) : (
          <div aria-hidden="true" className={cn(inputClass, 'flex items-center')}>
            <Skeleton className="h-3.5 flex-1" />
          </div>
        )}
        <p className="mt-2 text-[14px] text-ink-2">{left ? `Expires in ${left}` : 'Making a link…'}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={copy} disabled={!invite.data} icon={<Icon name="copy" size={18} />}>
          Copy link
        </Button>
        <Button variant="primary" onClick={share} disabled={!invite.data} icon={<Icon name="share" size={18} />}>
          Share
        </Button>
      </div>
      {isAdmin && (
        <button
          type="button"
          onClick={reset}
          disabled={resetting}
          className="mt-2 -mb-1.5 flex min-h-11 items-center rounded-lg pt-0.5 text-left text-[14px] font-medium text-ink-2 underline decoration-[1.5px] underline-offset-4 hover:text-ink disabled:opacity-50"
        >
          {resetting ? 'Making a new link…' : 'Make a new link (the old one stops working)'}
        </button>
      )}
    </Card>
  );
}
