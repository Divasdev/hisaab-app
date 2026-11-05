import { useState } from 'react';
import { useTitle } from '../hooks/useTitle';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { CATEGORIES, GROUP_KINDS } from '../lib/categories';
import { cn } from '../lib/cn';
import { Icon } from '../components/Icon';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { BrandMark, Wordmark } from '../components/ui/Brand';
import { Button, IconButton } from '../components/ui/Button';
import { Card, List, Row, SectionHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { FormError, TextField } from '../components/ui/Field';
import { BalanceInline, BalanceStack, BigTotal } from '../components/ui/Money';
import { BottomBar, Content, LargeTitle, Page, TopBar } from '../components/ui/Page';
import { Segmented } from '../components/ui/Segmented';
import { ConfirmSheet, Sheet } from '../components/ui/Sheet';
import { ListSkeleton } from '../components/ui/Skeleton';
import { Tile } from '../components/ui/Tile';

const people = [
  { id: 1, name: 'Divas Sharma' },
  { id: 2, name: 'Aman Verma' },
  { id: 3, name: 'Karan Mehta' },
  { id: 4, name: 'Rohit Nair', joined: false },
  { id: 5, name: 'Riya Iyer' },
  { id: 6, name: 'Sneha Reddy' },
  { id: 7, name: 'Priya Das' },
  { id: 8, name: 'Arjun Singh' },
];

// Every colour token, with what it is for. Red and green only ever mean money direction.
const swatches = [
  ['bg', 'Page', 'the white page'],
  ['surface-2', 'Row hover', 'a row under the pointer'],
  ['sunken', 'Pressed', 'pressed rows, loading bars'],
  ['line', 'Rule', 'hairlines between rows'],
  ['line-strong', 'Strong rule', 'input borders, word tags'],
  ['ink', 'Ink', 'text'],
  ['ink-2', 'Ink, secondary', 'hints, meta lines'],
  ['ink-3', 'Ink, faint', 'placeholders'],
  ['accent', 'Ballpoint blue', 'primary buttons, your avatar'],
  ['accent-text', 'Ballpoint blue, text', 'totals, links, focus rings'],
  ['accent-soft', 'Blue wash', 'hover on blue outlines'],
  ['owe', 'You owe', 'money you have to pay'],
  ['owe-soft', 'You owe, wash', 'hover on red outlines'],
  ['owed', 'You get back', 'money coming back to you'],
  ['owed-soft', 'You get back, wash', 'rare highlights'],
];

const icons = [
  'plus', 'minus', 'x', 'check', 'chevronLeft', 'chevronRight', 'chevronDown', 'arrowRight', 'copy', 'share', 'link',
  'trash', 'pencil', 'calendar', 'info', 'more', 'undo', 'refresh', 'logOut', 'smartphone', 'eye', 'eyeOff', 'userPlus',
];

/** /design: every building block on one page, for checking the look in light and dark mode. */
export default function DesignPage() {
  useTitle('Design');
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [seg, setSeg] = useState('expenses');
  const [paid, setPaid] = useState(false);
  return (
    <Page>
      <TopBar title="Design system" back="/" backLabel="App" />
      <Content>
        <LargeTitle>Design system</LargeTitle>
        <p className="mt-1.5 text-[16px] leading-relaxed text-ink-2">
          Last Page: the hisaab kept the way friends keep it on the last page of a notebook. Every part Hisaab is built from, in light and dark.
        </p>
        <Segmented
          className="mt-5"
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'Auto' },
          ]}
        />

        <SectionHeader title="Name" />
        <div className="flex items-center gap-4 border-y border-line py-5">
          <Wordmark className="text-[32px]" />
          <BrandMark size="lg" />
        </div>

        <SectionHeader title="Colour" />
        <List>
          {swatches.map(([token, label, use]) => (
            <Row
              key={token}
              leading={<span aria-hidden="true" className="size-10 shrink-0 rounded-md border border-line" style={{ background: `var(--${token})` }} />}
              title={label}
              subtitle={`${token} · ${use}`}
            />
          ))}
        </List>

        <SectionHeader title="Type" />
        <List>
          <TypeLine note="Martel 800 · big totals (font-display, tabular)">
            <span className="tabular font-display text-[52px] leading-[1.15] text-accent-text">₹1,20,000</span>
          </TypeLine>
          <TypeLine note="Martel 800 · page title 32 (LargeTitle)">
            <span className="font-display text-[32px] leading-10">Your hisaab</span>
          </TypeLine>
          <TypeLine note="Hind 700 · section heading 20 (SectionHeader)">
            <span className="text-[20px] leading-tight font-bold">Groups</span>
          </TypeLine>
          <TypeLine note="Hind 600 · row title 17">
            <span className="text-[17px] leading-6 font-semibold">Room 204, Godavari</span>
          </TypeLine>
          <TypeLine note="Hind 400 · body 16">
            <span className="text-[16px]">Plain sentences, one idea at a time.</span>
          </TypeLine>
          <TypeLine note="Hind 400 · secondary 14, ink-2">
            <span className="text-[14px] text-ink-2">4 members · 54 min ago</span>
          </TypeLine>
        </List>

        <SectionHeader title="Notebook marks" />
        <div className="space-y-8 border-y border-line py-6">
          <BigTotal paise={-1053209} lead="You owe, overall" />
          <BigTotal paise={124000} size="md" />
          <BigTotal paise={0} size="md" settledText="All settled up" />
        </div>
        <List className="mt-6">
          <li className="flex items-center gap-3 px-1 py-3.5 text-ink-2">
            <span className="min-w-0 flex-1">
              <span className="struck block truncate text-[17px] leading-6 font-semibold">Navratri dandiya night</span>
              <span className="mt-0.5 block text-[14px] leading-5">struck: settled or paid</span>
            </span>
            <BalanceStack paise={0} />
          </li>
          <li className="flex items-center gap-3 px-1 py-3.5">
            <span className={cn('min-w-0 flex-1', paid && 'text-ink-2')}>
              <span className={cn('relative inline-block max-w-full truncate align-top text-[17px] leading-6 font-semibold', paid && 'strike-draw')}>Aman pays you ₹340</span>
              <span className="mt-0.5 block text-[14px] leading-5 text-ink-2">strike-draw: the line drawn when marked paid</span>
            </span>
            <Button size="sm" variant={paid ? 'quiet' : 'secondary'} icon={paid ? <Icon name="undo" size={16} /> : null} onClick={() => setPaid((p) => !p)}>
              {paid ? 'Undo' : 'Mark paid'}
            </Button>
          </li>
        </List>

        <SectionHeader title="Money" />
        <List>
          <Row leading={<Avatar user={people[1]} />} title="Aman Verma" subtitle="BalanceStack, someone else" trailing={<BalanceStack paise={124000} you={false} />} />
          <Row leading={<Avatar user={people[0]} me />} title="You" subtitle="BalanceStack, you" trailing={<BalanceStack paise={-34000} />} />
          <Row leading={<Avatar user={people[2]} />} title="Karan Mehta" subtitle="Settled" trailing={<BalanceStack paise={0} you={false} />} />
        </List>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <BalanceInline paise={-181800} />
          <BalanceInline paise={7925} />
          <BalanceInline paise={0} />
          <span className="text-[13px] text-ink-2">BalanceInline, for the sidebar</span>
        </div>

        <SectionHeader title="Buttons" />
        <div className="space-y-3">
          <Button size="lg" full icon={<Icon name="plus" size={18} />}>
            Add expense
          </Button>
          <Button variant="secondary" size="lg" full>
            Try the demo account
          </Button>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Delete</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="quiet">Quiet link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small 40</Button>
            <Button size="md">Medium 48</Button>
            <Button size="lg">Large 56</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Edit">
              <Icon name="pencil" size={18} />
            </IconButton>
            <IconButton label="Delete">
              <Icon name="trash" size={18} />
            </IconButton>
            <IconButton label="More">
              <Icon name="more" size={20} />
            </IconButton>
          </div>
        </div>

        <SectionHeader title="People" />
        <div className="flex flex-wrap items-end gap-3">
          <Avatar user={people[0]} size="xl" me />
          <Avatar user={people[0]} size="lg" me />
          <Avatar user={people[1]} size="md" />
          <Avatar user={people[2]} size="sm" />
          <Avatar user={people[4]} size="xs" />
          <Avatar user={people[3]} size="md" />
        </div>
        <p className="mt-2 text-[14px] text-ink-2">Blue plate: you. Dashed: added by name, not joined yet.</p>
        <AvatarStack className="mt-4" users={people} max={5} />

        <SectionHeader title="Words, not icons" />
        <p className="text-[15px] leading-relaxed text-ink-2">Group kinds and categories are named, never drawn.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GROUP_KINDS.map((k) => (
            <Tile key={k.id} label={k.label} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Tile key={c.id} label={c.label} />
          ))}
        </div>

        <SectionHeader title="Icons" />
        <p className="text-[15px] leading-relaxed text-ink-2">Only where a word cannot go. 2px strokes, square ends, sharp corners.</p>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 sm:grid-cols-3">
          {icons.map((name) => (
            <li key={name} className="flex min-h-11 items-center gap-3 border-b border-line text-[14px] text-ink-2">
              <Icon name={name} size={20} className="shrink-0 text-ink" />
              <span className="pt-0.5">{name}</span>
            </li>
          ))}
        </ul>

        <SectionHeader title="Forms" />
        <div className="space-y-4">
          <TextField label="Group name" placeholder="Room 204, Flat 3B, Goa trip…" />
          <TextField label="UPI ID" placeholder="yourname@okaxis" hint="Find it in GPay, PhonePe or Paytm, under your profile." />
          <TextField label="UPI ID" defaultValue="divas@" error="It should look like name@bank." />
          <FormError>Wrong email or password.</FormError>
        </div>
        <Segmented
          className="mt-6"
          label="Example"
          value={seg}
          onChange={setSeg}
          options={[
            { value: 'expenses', label: 'Expenses' },
            { value: 'balances', label: 'Balances' },
            { value: 'activity', label: 'Activity' },
          ]}
        />

        <SectionHeader title="Lists and empty states" />
        <List>
          <Row to="/design" title="Goa trip, October" subtitle="Row with a link and chevron" chevron />
          <Row onClick={() => toast('Row tapped')} leading={<Avatar user={people[5]} size="sm" />} title="Sneha Reddy" subtitle="Row with a button" />
        </List>
        <ListSkeleton rows={2} className="mt-6" />
        <EmptyState
          title="No expenses yet"
          className="mt-6"
          action={
            <Button size="lg" icon={<Icon name="plus" size={18} />}>
              Add the first one
            </Button>
          }
        >
          Add what you paid for, and Hisaab works out who owes whom.
        </EmptyState>
        <Card className="mt-6">
          <p className="text-[15px] leading-relaxed">Card: a ruled box for a rare standalone note, like an invite. Never a container for lists.</p>
        </Card>

        <SectionHeader title="Feedback" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open a sheet
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            Open a confirm
          </Button>
          <Button variant="secondary" onClick={() => toast('“Dinner” added · ₹300 each', { action: { label: 'Undo', onClick: () => {} } })}>
            Show a toast
          </Button>
        </div>
        <div className="h-24" />
      </Content>
      <BottomBar>
        <Button size="lg" full icon={<Icon name="plus" size={18} />} onClick={() => toast('This is the BottomBar: one main action at thumb height.')}>
          Add expense
        </Button>
      </BottomBar>
      <Sheet open={sheet} onClose={() => setSheet(false)} title="A sheet" description="Drag the top down to close it. A flick follows your finger's speed.">
        <List>
          {people.slice(0, 4).map((p) => (
            <Row key={p.id} leading={<Avatar user={p} />} title={p.name} onClick={() => setSheet(false)} />
          ))}
        </List>
      </Sheet>
      <ConfirmSheet open={confirm} onClose={() => setConfirm(false)} title="Remove Rohit?" confirmLabel="Remove" onConfirm={() => setConfirm(false)}>
        Only for actions that cannot be undone. Everything else gets Undo instead.
      </ConfirmSheet>
    </Page>
  );
}

/** One line of the type scale: the sample, then what it is. */
function TypeLine({ note, children }) {
  return (
    <li className="px-1 py-3.5">
      <div className="break-words">{children}</div>
      <p className="mt-1 text-[13px] text-ink-2">{note}</p>
    </li>
  );
}
