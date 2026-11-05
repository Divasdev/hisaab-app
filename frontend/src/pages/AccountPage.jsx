import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { UPI_ID_PATTERN } from '../lib/upi';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, SectionHeader } from '../components/ui/Card';
import { FormError, TextField } from '../components/ui/Field';
import { Content, Page, TopBar } from '../components/ui/Page';
import { Segmented } from '../components/ui/Segmented';
import { ConfirmSheet } from '../components/ui/Sheet';

export default function AccountPage() {
  useTitle('Account');
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [upi, setUpi] = useState(user.upi_id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setName(user.name);
    setUpi(user.upi_id || '');
  }, [user.name, user.upi_id]);

  const upiWrong = upi.trim() && !UPI_ID_PATTERN.test(upi.trim());
  const dirty = name.trim() !== user.name || upi.trim() !== (user.upi_id || '');

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await updateProfile({ name, upi_id: upi });
      toast('Profile saved');
    } catch (err) {
      setError(err.detail || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <TopBar back="/" backLabel="Groups" title="Account" />
      <Content>
        <div className="flex flex-col items-center pt-2 text-center">
          <Avatar user={user} size="xl" />
          <h1 className="mt-3.5 text-[24px] font-bold tracking-[-0.02em]">{user.name}</h1>
          <p className="text-[15px] text-ink-2">{user.email}</p>
        </div>

        <SectionHeader title="Profile" />
        <Card as="form" onSubmit={save} className="space-y-4 p-4" noValidate>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="name" />
          <TextField
            label="UPI ID"
            placeholder="yourname@okaxis"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
            error={upiWrong ? 'It should look like name@bank.' : ''}
            hint="People in your groups see this, so they can pay you in one tap."
          />
          <FormError>{error}</FormError>
          {dirty && (
            <Button type="submit" full loading={busy} disabled={!name.trim() || upiWrong}>
              Save changes
            </Button>
          )}
        </Card>

        <SectionHeader title="Appearance" />
        <Segmented
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: 'Auto', icon: 'monitor' },
            { value: 'light', label: 'Light', icon: 'sun' },
            { value: 'dark', label: 'Dark', icon: 'moon' },
          ]}
        />
        <p className="mt-2 px-1 text-[13px] text-ink-3">Auto follows your phone or laptop setting.</p>

        <SectionHeader title="Demo data" />
        <Card className="p-4">
          <p className="text-[14.5px] leading-relaxed text-ink-2">
            This version runs on sample data saved in this browser. Reset it to get the original groups and expenses back.
          </p>
          <Button variant="secondary" full className="mt-3.5" icon={<Icon name="refresh" size={18} />} onClick={() => setResetOpen(true)}>
            Reset demo data
          </Button>
        </Card>

        <Button
          variant="danger"
          size="lg"
          full
          className="mt-8"
          icon={<Icon name="logOut" size={19} />}
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          Log out
        </Button>
        <p className="mt-8 text-center text-[13px] text-ink-3">Hisaab · Made by Divas Sharma</p>
      </Content>

      <ConfirmSheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset demo data?"
        confirmLabel="Reset"
        onConfirm={() => {
          api.resetDemo();
          setResetOpen(false);
          toast('Demo data is back to the start');
          navigate('/', { replace: true });
        }}
      >
        All groups, expenses and payments go back to the sample data. Anything you added is removed.
      </ConfirmSheet>
    </Page>
  );
}
