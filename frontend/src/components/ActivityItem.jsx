import { formatINR } from '../lib/money';
import { timeAgo } from '../lib/dates';
import { Tile } from './ui/Tile';

const TYPES = {
  group_created: ['burst', 'tone-4'],
  member_added: ['userPlus', 'tone-0'],
  member_joined: ['userPlus', 'tone-2'],
  member_claimed: ['userPlus', 'tone-2'],
  member_renamed: ['pencil', 'tone-n'],
  member_left: ['logOut', 'tone-n'],
  member_removed: ['logOut', 'tone-n'],
  role_changed: ['shield', 'tone-4'],
  expense_added: ['plus', 'tone-accent'],
  expense_edited: ['pencil', 'tone-n'],
  expense_deleted: ['trash', 'tone-7'],
  expense_restored: ['undo', 'tone-n'],
  payment_added: ['rupee', 'tone-2'],
  payment_removed: ['undo', 'tone-n'],
  group_renamed: ['pencil', 'tone-n'],
  invite_reset: ['link', 'tone-n'],
};

/**
 * Turns one activity record into a plain sentence.
 * The actor is an account (compare with your user id). People in data are members:
 * the API adds <key>_name and <key>_is_me for every member id in data.
 */
export function describeActivity(a, meUserId) {
  const d = a.data || {};
  const b = (text) => <b className="font-semibold">{text}</b>;
  const actorIsMe = a.actor.id === meUserId;
  const actor = b(actorIsMe ? 'You' : a.actor.name);
  const person = (key, lower = true) => b(d[`${key}_is_me`] ? (lower ? 'you' : 'You') : d[`${key}_name`]);
  const what = d.description && <>“{d.description}”</>;
  const amt = d.amount_paise != null && <span className="font-medium tabular-nums">{formatINR(d.amount_paise)}</span>;
  switch (a.type) {
    case 'group_created': return <>{actor} created the group</>;
    case 'member_added': return <>{actor} added {b(d.name)}</>;
    case 'member_joined': return <>{actor} joined the group</>;
    case 'member_claimed':
      return d.as_name && d.as_name !== a.actor.name ? <>{actor} joined as “{d.as_name}”</> : <>{actor} joined the group</>;
    case 'member_renamed': return <>{actor} renamed “{d.from}” to “{d.to}”</>;
    case 'member_left': return <>{actor} left the group</>;
    case 'member_removed': return <>{actor} removed {person('member_id')} from the group</>;
    case 'role_changed': return d.role === 'admin' ? <>{actor} made {person('member_id')} an admin</> : <>{actor} removed admin rights from {person('member_id')}</>;
    case 'expense_added': return <>{actor} added {what} · {amt}</>;
    case 'expense_edited': return <>{actor} changed the {(d.changes || []).join(', ')} of {what}</>;
    case 'expense_deleted': return <>{actor} deleted {what} · {amt}</>;
    case 'expense_restored': return <>{actor} restored {what}</>;
    case 'payment_added': return <>{person('from_member_id', false)} paid {person('to_member_id')} {amt}</>;
    case 'payment_removed': return <>{actor} removed a {amt} payment</>;
    case 'group_renamed': return <>{actor} renamed the group to “{d.to}”</>;
    case 'invite_reset': return <>{actor} made a new invite link</>;
    default: return <>{actor} made a change</>;
  }
}

export function ActivityItem({ item, meId, showGroup }) {
  const [icon, tone] = TYPES[item.type] || ['activity', 'tone-n'];
  return (
    <li className="flex gap-3 px-4 py-3">
      <Tile icon={icon} tone={tone} size="sm" />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[15px] leading-snug text-ink">{describeActivity(item, meId)}</p>
        <p className="mt-0.5 text-[13px] text-ink-3">
          {showGroup && item.group ? `${item.group.name} · ` : ''}
          {timeAgo(item.created_at)}
        </p>
      </div>
    </li>
  );
}
