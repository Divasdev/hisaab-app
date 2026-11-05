import { formatINR } from '../lib/money';
import { timeAgo } from '../lib/dates';

/**
 * Turns one activity record into a plain sentence.
 * The actor is an account (compare with your user id). People in data are members:
 * the API adds <key>_name and <key>_is_me for every member id in data.
 * What was deleted or removed is struck through, the way it would be on paper.
 */
export function describeActivity(a, meUserId) {
  const d = a.data || {};
  const b = (text) => <b className="font-semibold">{text}</b>;
  const struck = (node) => <s className="struck text-ink-2">{node}</s>;
  const actorIsMe = a.actor.id === meUserId;
  const actor = b(actorIsMe ? 'You' : a.actor.name);
  const person = (key, lower = true) => b(d[`${key}_is_me`] ? (lower ? 'you' : 'You') : d[`${key}_name`]);
  const what = d.description && <>“{d.description}”</>;
  const amt = d.amount_paise != null && <span className="tabular font-medium">{formatINR(d.amount_paise)}</span>;
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
    case 'expense_deleted': return <>{actor} deleted {struck(<>{what} · {amt}</>)}</>;
    case 'expense_restored': return <>{actor} restored {what}</>;
    case 'payment_added': return <>{person('from_member_id', false)} paid {person('to_member_id')} {amt}</>;
    case 'payment_removed': return <>{actor} removed a {struck(amt)} payment</>;
    case 'group_renamed': return <>{actor} renamed the group to “{d.to}”</>;
    case 'invite_reset': return <>{actor} made a new invite link</>;
    default: return <>{actor} made a change</>;
  }
}

/** One line of the feed: the sentence, then where and when in a quieter line under it. */
export function ActivityItem({ item, meId, showGroup }) {
  return (
    <li className="px-1 py-3.5">
      <p className="text-[16px] leading-6 text-ink">{describeActivity(item, meId)}</p>
      <p className="mt-0.5 text-[14px] leading-5 text-ink-2">
        {showGroup && item.group ? `${item.group.name} · ` : ''}
        {timeAgo(item.created_at)}
      </p>
    </li>
  );
}
