import { useState } from 'react';
import { useTitle } from '../hooks/useTitle';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { CATEGORIES, GROUP_KINDS } from '../lib/categories';
import { Icon } from '../components/Icon';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, List, Row, SectionHeader } from '../components/ui/Card';
import { TextField } from '../components/ui/Field';
import { BalanceStack } from '../components/ui/Money';
import { BottomBar, Content, LargeTitle, Page, TopBar } from '../components/ui/Page';
import { Segmented } from '../components/ui/Segmented';
import { Sheet } from '../components/ui/Sheet';
import { Tile } from '../components/ui/Tile';

const people = [
  { id: 1, name: 'Divas Sharma' },
  { id: 2, name: 'Aman Verma' },
  { id: 3, name: 'Karan Mehta' },
  { id: 4, name: 'Rohit Nair' },
  { id: 5, name: 'Riya Iyer' },
  { id: 6, name: 'Sneha Reddy' },
  { id: 7, name: 'Priya Das' },
  { id: 8, name: 'Arjun Singh' },
];

const swatches = [
  ['bg', 'Page'],
  ['surface', 'Card'],
  ['sunken', 'Sunken'],
  ['line', 'Border'],
  ['ink', 'Text'],
  ['ink-2', 'Secondary text'],
  ['accent', 'Accent'],
  ['accent-soft', 'Accent soft'],
  ['owed', 'Owed to you'],
  ['owed-soft', 'Owed soft'],
  ['owe', 'You owe'],
  ['owe-soft', 'Owe soft'],
];

/** /design: every building block on one page, for checking the look in light and dark mode. */
export default function DesignPage() {
  useTitle('Design');
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [sheet, setSheet] = useState(false);
  const [seg, setSeg] = useState('expenses');
  return (
    <Page>
      <TopBar title="Design system" back="/" backLabel="App" />
      <Content>
        <LargeTitle>Design system</LargeTitle>
        <p className="mt-1.5 px-1 text-[15.5px] text-ink-2">Colours, type and parts used across Hisaab.</p>
        <Segmented
          className="mt-5"
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: 'Auto', icon: 'monitor' },
            { value: 'light', label: 'Light', icon: 'sun' },
            { value: 'dark', label: 'Dark', icon: 'moon' },
          ]}
        />

        <SectionHeader title="Colour" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {swatches.map(([token, label]) => (
            <div key={token} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="h-12" style={{ background: `var(--${token})` }} />
              <div className="px-2.5 py-2">
                <p className="text-[13px] font-medium">{label}</p>
                <p className="font-mono text-[11px] text-ink-3">{token}</p>
              </div>
            </div>
          ))}
        </div>

        <SectionHeader title="Type" />
        <Card className="space-y-3 p-5">
          <p className="text-[46px] leading-none font-bold tracking-[-0.04em] tabular-nums">₹1,20,000</p>
          <p className="text-[32px] leading-tight font-bold tracking-[-0.025em]">Large title 32</p>
          <p className="text-[22px] font-semibold tracking-[-0.015em]">Title 22</p>
          <p className="text-[17px] font-semibold">Headline 17</p>
          <p className="text-[16px]">Body 16. Plain sentences, one idea at a time.</p>
          <p className="text-[14px] text-ink-2">Secondary 14. Hints and descriptions.</p>
          <p className="text-[13px] text-ink-3">Footnote 13. Times and small details.</p>
        </Card>

        <SectionHeader title="Money" />
        <List>
          <Row leading={<Avatar user={people[1]} />} title="Aman Verma" trailing={<BalanceStack paise={124000} you={false} />} />
          <Row leading={<Avatar user={people[0]} />} title="You" trailing={<BalanceStack paise={-34000} />} />
          <Row leading={<Avatar user={people[3]} />} title="Rohit Nair" trailing={<BalanceStack paise={0} you={false} />} />
        </List>

        <SectionHeader title="Buttons" />
        <Card className="space-y-2.5 p-4">
          <Button size="lg" full icon={<Icon name="plus" size={21} strokeWidth={2.2} />}>
            Add expense
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tinted">Settle up</Button>
            <Button variant="danger">Delete</Button>
            <Button variant="ghost">Ghost</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Card>

        <SectionHeader title="People, groups, categories" />
        <Card className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <Avatar key={p.id} user={p} />
            ))}
          </div>
          <AvatarStack users={people} max={5} />
          <div className="flex flex-wrap gap-2">
            {GROUP_KINDS.map((k) => (
              <Tile key={k.id} icon={k.icon} tone={k.tone} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Tile key={c.id} icon={c.icon} tone={c.tone} size="sm" />
            ))}
          </div>
        </Card>

        <SectionHeader title="Controls" />
        <Card className="space-y-4 p-4">
          <Segmented
            label="Example"
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'expenses', label: 'Expenses' },
              { value: 'balances', label: 'Balances' },
              { value: 'activity', label: 'Activity' },
            ]}
          />
          <TextField label="Group name" placeholder="Room 204, Flat 3B, Goa trip…" />
          <TextField label="UPI ID" defaultValue="divas@" error="It should look like name@bank." />
        </Card>

        <SectionHeader title="Feedback" />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open a sheet
          </Button>
          <Button variant="secondary" onClick={() => toast('“Dinner” added · ₹300 each', { action: { label: 'Undo', onClick: () => {} } })}>
            Show a toast
          </Button>
        </div>
        <div className="h-40" />
      </Content>
      <BottomBar>
        <p className="text-center text-[13px] text-ink-3">Scroll: the top and bottom bars are frosted glass.</p>
      </BottomBar>
      <Sheet open={sheet} onClose={() => setSheet(false)} title="A frosted sheet" description="Drag the top down to close it. Flick it and it follows your speed.">
        <List className="bg-surface/70">
          {people.slice(0, 4).map((p) => (
            <Row key={p.id} leading={<Avatar user={p} />} title={p.name} onClick={() => setSheet(false)} />
          ))}
        </List>
      </Sheet>
    </Page>
  );
}
