import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api';
import { useTitle } from '../hooks/useTitle';
import { useToast } from '../context/ToastContext';
import { GROUP_KINDS } from '../lib/categories';
import { cn } from '../lib/cn';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { FormError, inputClass, TextField } from '../components/ui/Field';
import { BottomBar, Content, LargeTitle, Page, TopBar } from '../components/ui/Page';
import { Tile } from '../components/ui/Tile';

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
        <p className="mt-1.5 px-1 text-[15.5px] text-ink-2">Add your friends by name. You can split with them straight away, and invite them after.</p>
        <form id="new-group" onSubmit={create} className="mt-7 space-y-7">
          <TextField
            label="Group name"
            placeholder="Room 204, Flat 3B, Goa trip…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoFocus
            autoComplete="off"
          />
          <fieldset>
            <legend className="mb-2.5 px-0.5 text-[14px] font-medium text-ink-2">What is it for?</legend>
            <div className="grid grid-cols-2 gap-2.5">
              {GROUP_KINDS.map((k) => {
                const on = kind === k.id;
                return (
                  <label
                    key={k.id}
                    className={cn(
                      'relative flex cursor-pointer items-center gap-3 rounded-2xl border bg-surface p-3.5 transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.98] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/20',
                      on ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-line hover:border-line-strong',
                    )}
                  >
                    <input type="radio" name="kind" value={k.id} checked={on} onChange={() => setKind(k.id)} className="sr-only" />
                    <Tile icon={k.icon} tone={k.tone} size="sm" />
                    <span className="text-[15.5px] font-medium">{k.label}</span>
                    {on && (
                      <span className="absolute top-2 right-2 grid size-5 animate-pop place-items-center rounded-full bg-accent text-white">
                        <Icon name="check" size={13} strokeWidth={3} />
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <PeopleInput people={people} setPeople={setPeople} draft={draft} setDraft={setDraft} />
          <FormError>{error}</FormError>
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

/** Type a name, press Enter or Add. Names become chips; × removes one. You are added automatically. */
function PeopleInput({ people, setPeople, draft, setDraft }) {
  const add = () => {
    const name = draft.trim().slice(0, 40);
    if (!name) return;
    setPeople([...people, name]);
    setDraft('');
  };
  return (
    <fieldset>
      <legend className="mb-2.5 px-0.5 text-[14px] font-medium text-ink-2">Who&apos;s in it?</legend>
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
        <Button variant="secondary" className="h-12 shrink-0 rounded-xl px-4" onClick={add} disabled={!draft.trim()} icon={<Icon name="plus" size={18} />}>
          Add
        </Button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="People in this group">
        <li className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface pr-3 pl-1 text-[15px]">
          <Avatar user={{ name: 'You' }} size="xs" />
          You
        </li>
        {people.map((p, i) => (
          <li key={`${p}-${i}`} className="inline-flex h-9 animate-pop items-center gap-2 rounded-[10px] border border-line bg-surface pl-1 text-[15px]">
            <Avatar user={{ name: p }} size="xs" />
            {p}
            <button
              type="button"
              aria-label={`Remove ${p}`}
              onClick={() => setPeople(people.filter((_, j) => j !== i))}
              className="grid h-full w-8 place-items-center rounded-r-[10px] text-ink-3 hover:bg-sunken hover:text-ink"
            >
              <Icon name="x" size={15} />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 px-0.5 text-[13.5px] text-ink-3">They don&apos;t need the app yet. When they join, they pick their name and see everything.</p>
    </fieldset>
  );
}
