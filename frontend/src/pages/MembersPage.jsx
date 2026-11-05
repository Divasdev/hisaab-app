import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { api, gql } from '../api';
import { MEMBERS_SCREEN } from '../api/queries';
import { useApi } from '../hooks/useApi';
import { useTitle } from '../hooks/useTitle';
import { useToast } from '../context/ToastContext';
import { GROUP_KINDS } from '../lib/categories';
import { cn } from '../lib/cn';
import { copyText, shareOrFalse } from '../lib/feedback';
import { formatINR } from '../lib/money';
import { peopleOf } from '../lib/people';
import { Icon } from '../components/Icon';
import { InviteCard } from '../components/InviteCard';
import { Avatar } from '../components/ui/Avatar';
import { Button, IconButton } from '../components/ui/Button';
import { Card, List, Row, SectionHeader } from '../components/ui/Card';
import { FormError, TextField } from '../components/ui/Field';
import { Content, ErrorPage, LargeTitle, Page, TopBar } from '../components/ui/Page';
import { ConfirmSheet, Sheet } from '../components/ui/Sheet';
import { ListSkeleton } from '../components/ui/Skeleton';
import { Tile } from '../components/ui/Tile';

export default function MembersPage() {
  const { groupId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const group = useApi(() => gql(MEMBERS_SCREEN, { id: Number(groupId) }), [groupId]);
  const g = group.data?.group;
  const people = useMemo(() => peopleOf(g), [g]);
  const [actionFor, setActionFor] = useState(null);
  const [editFor, setEditFor] = useState(null); // a member to rename, or 'new' to add someone
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useTitle(g ? `Members of ${g.name}` : 'Members');

  // /members?add=1 opens "Add person" straight away (used by the empty group screen).
  useEffect(() => {
    if (params.get('add') === '1') {
      setEditFor('new');
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  if (group.error && !g) return <ErrorPage error={group.error} />;

  const isAdmin = g?.my_role === 'admin';
  const me = g?.members.find((m) => m.id === g.my_member_id);
  const joined = g?.members.filter((m) => m.joined) || [];
  const admins = joined.filter((m) => m.role === 'admin');
  const leaveBlock = !g
    ? null
    : me.balance_paise !== 0
      ? `You still ${me.balance_paise < 0 ? 'owe' : 'get back'} ${formatINR(me.balance_paise)} here. Settle up first, then you can leave.`
      : isAdmin && joined.length > 1 && admins.length === 1
        ? 'You are the only admin. Make someone else an admin first.'
        : null;

  /** A personal invite: the link opens the join page with their name already picked. */
  async function invite(m) {
    try {
      const { token } = await api.getInvite(g.id);
      const url = `${window.location.origin}/join/${token}?as=${m.id}`;
      const first = m.name.split(' ')[0];
      const text = `Hi ${first}, I added you to "${g.name}" on Hisaab so we can split our expenses. Open this link and tap your name to join: ${url}`;
      if (!(await shareOrFalse({ title: `Join ${g.name} on Hisaab`, text })) && (await copyText(text)))
        toast(`Invite for ${first} copied. Paste it in WhatsApp or SMS.`, { icon: 'copy' });
    } catch (err) {
      toast(err.detail || err.message, { icon: 'info' });
    }
  }

  async function run(fn, done) {
    setBusy(true);
    setError('');
    try {
      await fn();
      done?.();
      setConfirm(null);
    } catch (err) {
      setError(err.detail || err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleAdmin(m) {
    setActionFor(null);
    try {
      await api.updateMember(g.id, m.id, { role: m.role === 'admin' ? 'member' : 'admin' });
      toast(m.role === 'admin' ? `${m.name.split(' ')[0]} is no longer an admin` : `${m.name.split(' ')[0]} is now an admin`, { icon: 'shield' });
    } catch (err) {
      toast(err.detail || err.message, { icon: 'info' });
    }
  }

  const canOpenMenu = (m) => m.id !== g.my_member_id && (!m.joined || isAdmin);

  return (
    <Page>
      <TopBar back={`/groups/${groupId}`} backLabel={g?.name || 'Back'} title="Members" />
      <Content>
        <LargeTitle>Members</LargeTitle>
        <p className="mt-1.5 px-1 text-[15.5px] text-ink-2">{g ? `${g.members.length} ${g.members.length === 1 ? 'person' : 'people'} in ${g.name}` : ' '}</p>

        {!g ? (
          <ListSkeleton rows={4} className="mt-6" />
        ) : (
          <>
            <SectionHeader
              title="People"
              action={
                <Button variant="ghost" size="sm" className="-mr-2 text-accent-text" icon={<Icon name="userPlus" size={17} />} onClick={() => setEditFor('new')}>
                  Add person
                </Button>
              }
            />
            <List>
              {g.members.map((m) => (
                <Row
                  key={m.id}
                  leading={<Avatar user={m} />}
                  title={people.name(m.id)}
                  subtitle={m.joined ? m.upi_id || 'No UPI ID yet' : m.invite_email ? `Not joined yet · ${m.invite_email}` : 'Not joined yet'}
                  trailing={
                    <span className="flex items-center gap-1.5">
                      {m.role === 'admin' && m.joined && (
                        <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[12px] font-semibold text-accent-text">Admin</span>
                      )}
                      {!m.joined && (
                        <Button variant="tinted" size="sm" onClick={() => invite(m)}>
                          Invite
                        </Button>
                      )}
                      {canOpenMenu(m) && (
                        <IconButton label={`Options for ${m.name}`} onClick={() => setActionFor(m)} className="-mr-2">
                          <Icon name="more" size={20} />
                        </IconButton>
                      )}
                    </span>
                  }
                />
              ))}
            </List>
            <p className="mt-2 px-1 text-[13px] leading-snug text-ink-3">
              People who haven&apos;t joined can still be in expenses. When they open their invite, they tap their name and see everything.
            </p>

            <SectionHeader title="Invite link for everyone" />
            <InviteCard groupId={g.id} groupName={g.name} isAdmin={isAdmin} />

            {isAdmin && <GroupDetails g={g} />}

            <SectionHeader title="Leave the group" />
            <Card className="p-4">
              <p className="text-[14.5px] leading-relaxed text-ink-2">
                {leaveBlock || 'You will stop seeing this group. To come back, someone has to send you a new invite link.'}
              </p>
              <Button
                variant="danger"
                full
                className="mt-3.5"
                disabled={Boolean(leaveBlock)}
                onClick={() => {
                  setError('');
                  setConfirm({ type: 'leave' });
                }}
                icon={<Icon name="logOut" size={18} />}
              >
                Leave group
              </Button>
            </Card>
          </>
        )}
      </Content>

      {/* Options for one person */}
      <Sheet
        open={Boolean(actionFor)}
        onClose={() => setActionFor(null)}
        title={actionFor?.name}
        description={actionFor && (actionFor.joined ? balanceSentence(actionFor) : `Not joined yet · ${balanceSentence(actionFor).toLowerCase()}`)}
      >
        {actionFor && (
          <List className="bg-surface/70">
            {!actionFor.joined && (
              <>
                <Row
                  onClick={() => {
                    const m = actionFor;
                    setActionFor(null);
                    invite(m);
                  }}
                  leading={<Tile icon="share" tone="tone-accent" size="sm" />}
                  title="Send invite"
                  subtitle="A message with a link that picks their name"
                />
                <Row
                  onClick={() => {
                    const m = actionFor;
                    setActionFor(null);
                    setEditFor(m);
                  }}
                  leading={<Tile icon="pencil" tone="tone-n" size="sm" />}
                  title="Edit name or email"
                />
              </>
            )}
            {actionFor.joined && isAdmin && (
              <Row
                onClick={() => toggleAdmin(actionFor)}
                leading={<Tile icon="shield" tone="tone-4" size="sm" />}
                title={actionFor.role === 'admin' ? 'Remove admin rights' : 'Make admin'}
                subtitle={actionFor.role === 'admin' ? 'They can still add expenses' : 'Admins can rename the group and manage people'}
              />
            )}
            {isAdmin && (
              <Row
                onClick={
                  actionFor.balance_paise === 0
                    ? () => {
                        const m = actionFor;
                        setActionFor(null);
                        setError('');
                        setConfirm({ type: 'remove', member: m });
                      }
                    : undefined
                }
                leading={<Tile icon="logOut" tone="tone-7" size="sm" />}
                title={<span className={actionFor.balance_paise === 0 ? 'text-owe' : 'text-ink-3'}>Remove from group</span>}
                subtitle={actionFor.balance_paise === 0 ? 'Their past expenses stay in the group' : 'They need to settle up first'}
              />
            )}
          </List>
        )}
      </Sheet>

      <PersonSheet editFor={editFor} groupId={g?.id} onClose={() => setEditFor(null)} onAdded={(m) => toast(`${m.name} added`, { icon: 'userPlus', action: { label: 'Invite', onClick: () => invite(m) } })} />

      <ConfirmSheet
        open={confirm?.type === 'remove'}
        onClose={() => setConfirm(null)}
        title={`Remove ${confirm?.member?.name.split(' ')[0]}?`}
        confirmLabel="Remove"
        busy={busy}
        error={error}
        onConfirm={() => run(() => api.removeMember(g.id, confirm.member.id), () => toast(`${confirm.member.name.split(' ')[0]} was removed`, { icon: 'logOut' }))}
      >
        {confirm?.member?.joined
          ? `They will lose access to ${g?.name}. Their past expenses stay. This can't be undone, but you can invite them again.`
          : `${confirm?.member?.name} will be taken off the list. Their past expenses stay.`}
      </ConfirmSheet>

      <ConfirmSheet
        open={confirm?.type === 'leave'}
        onClose={() => setConfirm(null)}
        title={`Leave ${g?.name}?`}
        confirmLabel="Leave group"
        busy={busy}
        error={error}
        onConfirm={() =>
          run(
            () => api.leaveGroup(g.id),
            () => {
              navigate('/', { replace: true });
              toast(`You left ${g.name}`, { icon: 'logOut' });
            },
          )
        }
      >
        You will stop seeing its expenses. To come back, someone in the group has to send you a new invite link.
      </ConfirmSheet>
    </Page>
  );
}

function balanceSentence(m) {
  if (m.balance_paise > 0) return `Gets back ${formatINR(m.balance_paise)} in this group`;
  if (m.balance_paise < 0) return `Owes ${formatINR(m.balance_paise)} in this group`;
  return 'Settled up in this group';
}

/** Add a person by name (editFor = 'new'), or fix the name/email of someone who hasn't joined. */
function PersonSheet({ editFor, groupId, onClose, onAdded }) {
  const adding = editFor === 'new';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!editFor) return;
    setName(adding ? '' : editFor.name);
    setEmail(adding ? '' : editFor.invite_email || '');
    setError('');
  }, [editFor, adding]);

  async function save(e) {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (adding) {
        const m = await api.addMember(groupId, { name, email });
        onClose();
        onAdded(m);
      } else {
        await api.updateMember(groupId, editFor.id, { name, email });
        onClose();
        toast('Saved');
      }
    } catch (err) {
      setError(err.detail || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={Boolean(editFor)}
      onClose={onClose}
      title={adding ? 'Add a person' : 'Edit name or email'}
      description={adding ? "They don't need Hisaab yet. You can split with them right away." : undefined}
      footer={
        <Button size="lg" full loading={busy} disabled={!name.trim()} onClick={save}>
          {adding ? `Add ${name.trim().split(' ')[0] || 'person'}` : 'Save'}
        </Button>
      }
    >
      <form onSubmit={save} className="space-y-4 pt-1" noValidate>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="off" data-autofocus placeholder="Aman" />
        <TextField
          label="Email (optional)"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="aman@gmail.com"
          hint="If they already use Hisaab with this email, the invite shows up in their app."
        />
        <FormError>{error}</FormError>
        <button type="submit" className="hidden" />
      </form>
    </Sheet>
  );
}

function GroupDetails({ g }) {
  const toast = useToast();
  const [name, setName] = useState(g.name);
  const [kind, setKind] = useState(g.kind);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setName(g.name);
    setKind(g.kind);
  }, [g.name, g.kind]);
  const dirty = name.trim() !== g.name || kind !== g.kind;

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.updateGroup(g.id, { name, kind });
      toast('Group updated');
    } catch (err) {
      setError(err.detail || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SectionHeader title="Group details" />
      <Card as="form" onSubmit={save} className="space-y-4 p-4">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <div>
          <p className="mb-2 px-0.5 text-[14px] font-medium text-ink-2">Kind</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kind of group">
            {GROUP_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={kind === k.id}
                onClick={() => setKind(k.id)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-[14.5px] font-medium transition-[border-color,transform] active:scale-[0.97]',
                  kind === k.id ? 'border-accent bg-accent-soft text-accent-text' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
                )}
              >
                <Icon name={k.icon} size={16} />
                {k.label}
              </button>
            ))}
          </div>
        </div>
        <FormError>{error}</FormError>
        {dirty && (
          <Button type="submit" full loading={busy} disabled={!name.trim()}>
            Save changes
          </Button>
        )}
      </Card>
    </>
  );
}
