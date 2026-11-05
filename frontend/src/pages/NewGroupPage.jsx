import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GROUP_KINDS } from '../lib/categories';
import { cn } from '../lib/cn';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/ui/Avatar';
import { Button, IconButton } from '../components/ui/Button';
import { FormError, inputClass, TextField } from '../components/ui/Field';
import { BottomBar, Content, LargeTitle, Page, TopBar } from '../components/ui/Page';

export default function NewGroupPage() {
  useTitle('New group');
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [kind, setKind] = useState('hostel');
  const [people, setPeople] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create(e) {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      const pending = draft.trim() ? [...people, draft.trim()] : people;
      const g = await api.createGroup({ name, kind, members: pending.map((n) => ({ name: n })) });
      toast(`${g.name} is ready`);
      navigate(`/groups/${g.id}`, { replace: true });
    } catch (err) {
      setError(err.detail || err.message);
      setBusy(false);
    }
  }

  return (
    <Page>
      <TopBar title="New group" back="/" backLabel="Groups" />
      <Content>
        <LargeTitle>New group</LargeTitle>
        <p className="mt-1.5 text-[16px] leading-relaxed text-ink-2">Add your friends by name. You can split with them straight away, and invite them after.</p>
        <form id="new-group" onSubmit={create} className="mt-7">
          <TextField
            label="Group name"
            placeholder="Room 204, Flat 3B, Goa trip…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoFocus
            autoComplete="off"
          />
          <fieldset className="mt-8">
            <legend className="mb-3 text-[15px] font-semibold text-ink">What is it for?</legend>
            <div className="flex flex-wrap gap-2">
              {GROUP_KINDS.map((k) => {
                const on = kind === k.id;
                return (
                  <label
                    key={k.id}
                    className={cn(
                      'inline-flex h-11 cursor-pointer items-center rounded-lg border-[1.5px] px-4 pt-0.5 text-[16px] font-semibold select-none',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-text',
                      on ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong bg-surface text-ink hover:border-accent-text hover:text-accent-text',
                    )}
                  >
                    <input type="radio" name="kind" value={k.id} checked={on} onChange={() => setKind(k.id)} className="sr-only" />
                    {k.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <PeopleInput people={people} setPeople={setPeople} draft={draft} setDraft={setDraft} />
          {error && (
            <div className="mt-6">
              <FormError>{error}</FormError>
            </div>
          )}
        </form>
      </Content>
      <BottomBar>
        <Button type="submit" form="new-group" size="lg" full loading={busy} disabled={!name.trim()}>
          Create group
        </Button>
      </BottomBar>
    </Page>
  );
}

/** Type a name, press Enter or Add. Each name becomes a row; the x removes it. You are added automatically. */
function PeopleInput({ people, setPeople, draft, setDraft }) {
  const { user } = useAuth();
  const add = () => {
    const name = draft.trim().slice(0, 40);
    if (!name) return;
    setPeople([...people, name]);
    setDraft('');
  };
  return (
    <fieldset className="mt-8">
      <legend className="mb-3 text-[15px] font-semibold text-ink">Who&apos;s in it?</legend>
      <div className="flex gap-2">
        <label htmlFor="person-name" className="sr-only">
          Friend&apos;s name
        </label>
        <input
          id="person-name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Friend's name"
          autoComplete="off"
          enterKeyHint="done"
          className={inputClass}
        />
        <Button variant="secondary" className="shrink-0" onClick={add} disabled={!draft.trim()} icon={<Icon name="plus" size={18} />}>
          Add
        </Button>
      </div>
      <ul className="mt-4 divide-y divide-line border-y border-line" aria-label="People in this group">
        <li className="flex min-h-14 items-center gap-3 px-1 py-2">
          <Avatar user={user || { name: 'You' }} size="sm" me />
          <span className="min-w-0 flex-1 truncate pt-0.5 text-[17px] leading-6 font-semibold">You</span>
        </li>
        {people.map((p, i) => (
          <li key={`${p}-${i}`} className="flex min-h-14 items-center gap-3 py-1.5 pl-1">
            <Avatar user={{ name: p }} size="sm" pending />
            <span className="min-w-0 flex-1 truncate pt-0.5 text-[17px] leading-6 font-semibold">{p}</span>
            <IconButton label={`Remove ${p}`} onClick={() => setPeople(people.filter((_, j) => j !== i))}>
              <Icon name="x" size={17} />
            </IconButton>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[14px] leading-snug text-ink-2">They don&apos;t need the app yet. When they join, they pick their name and see everything.</p>
    </fieldset>
  );
}
