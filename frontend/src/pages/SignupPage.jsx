import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { AuthFrame } from '../components/AuthFrame';
import { Button, IconButton } from '../components/ui/Button';
import { FormError, TextField } from '../components/ui/Field';
import { Icon } from '../components/Icon';

export default function SignupPage() {
  useTitle('Create account');
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const short = form.password.length > 0 && form.password.length < 8;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(form);
      navigate('/welcome', { replace: true, state: location.state });
    } catch (err) {
      setError(err.detail || err.message);
      setBusy(false);
    }
  }

  return (
    <AuthFrame>
      <h1 className="mt-10 pt-0.5 text-[22px] leading-7 font-bold">Create your account</h1>
      <form onSubmit={submit} className="mt-5" noValidate>
        <div className="space-y-4">
          <TextField label="Your name" autoComplete="name" value={form.name} onChange={set('name')} maxLength={40} hint="Your friends will see this name." />
          <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} />
          <TextField
            label="Password"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            hint={short ? `${8 - form.password.length} more characters needed` : 'At least 8 characters.'}
            trailing={
              <IconButton label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((v) => !v)}>
                <Icon name={show ? 'eyeOff' : 'eye'} size={19} />
              </IconButton>
            }
          />
        </div>
        <div className="mt-6 space-y-4">
          <FormError>{error}</FormError>
          <Button type="submit" size="lg" full loading={busy} disabled={!form.name.trim() || !form.email || form.password.length < 8}>
            Create account
          </Button>
        </div>
      </form>
      <p className="mt-8 text-[15px] text-ink-2">
        Already have an account?{' '}
        <Link
          to="/login"
          state={location.state}
          className="-mx-1 inline-flex min-h-11 items-center rounded-md px-1 pt-0.5 font-semibold text-accent-text underline decoration-[1.5px] underline-offset-4 hover:bg-accent-soft"
        >
          Log in
        </Link>
      </p>
    </AuthFrame>
  );
}
