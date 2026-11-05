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
import { SectionHeader } from '../components/ui/Card';
import { FormError, TextField } from '../components/ui/Field';
import { Content, LargeTitle, Page, TopBar } from '../components/ui/Page';
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
        <div className="flex items-center gap-4 pt-2">
          <Avatar user={user} size="lg" me />
          <LargeTitle className="min-w-0 flex-1 break-words">{user.name}</LargeTitle>
        </div>

        <SectionHeader title="Profile" />
        <form onSubmit={save} noValidate>
          <ul className="divide-y divide-line border-y border-line">
            <li className="py-4">
              <p className="text-[15px] font-semibold text-ink">Email</p>
              <p className="mt-1 truncate text-[16px] text-ink-2">{user.email}</p>
            </li>
            <li className="py-4">
              <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="name" />
            </li>
            <li className="py-4">
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
            </li>
          </ul>
          {(error || dirty) && (
            <div className="mt-4 space-y-3">
              <FormError>{error}</FormError>
              {dirty && (
                <Button type="submit" full loading={busy} disabled={!name.trim() || upiWrong}>
                  Save changes
                </Button>
              )}
            </div>
          )}
        </form>

        <SectionHeader title="Appearance" />
        <Segmented
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'Auto' },
          ]}
        />
        <p className="mt-2.5 text-[14px] text-ink-2">Auto follows your phone or laptop setting.</p>

        <SectionHeader title="Demo data" />
        <p className="text-[15px] leading-relaxed text-ink-2">
          This version runs on sample data saved in this browser. Reset it to get the original groups and expenses back.
        </p>
        <Button variant="secondary" full className="mt-4" icon={<Icon name="refresh" size={18} />} onClick={() => setResetOpen(true)}>
          Reset demo data
        </Button>

        <Button
          variant="danger"
          size="lg"
          full
          className="mt-16"
          icon={<Icon name="logOut" size={19} />}
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          Log out
        </Button>
        <p className="mt-8 text-[14px] text-ink-2">Made by Divas Sharma</p>
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
