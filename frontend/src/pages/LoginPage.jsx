import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { AuthFrame } from '../components/AuthFrame';
import { Button, IconButton } from '../components/ui/Button';
import { FormError, TextField } from '../components/ui/Field';
import { Icon } from '../components/Icon';

export default function LoginPage() {
  useTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  async function submit(e, demo = false) {
    e?.preventDefault();
    setError('');
    setBusy(demo ? 'demo' : 'form');
    try {
      await login(demo ? 'divas@hisaab.demo' : email, demo ? 'demo1234' : password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.detail || err.message);
      setBusy(null);
    }
  }

  return (
    <AuthFrame>
      <h1 className="text-[30px] leading-tight font-bold tracking-[-0.025em]">Welcome back</h1>
      <p className="mt-2 text-[16px] text-ink-2">Log in to see who owes whom.</p>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField
          label="Password"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          trailing={
            <IconButton label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((v) => !v)}>
              <Icon name={show ? 'eyeOff' : 'eye'} size={19} />
            </IconButton>
          }
        />
        <FormError>{error}</FormError>
        <Button type="submit" size="lg" full loading={busy === 'form'} disabled={!email || !password || !!busy}>
          Log in
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-[13px] text-ink-3">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <Button variant="secondary" size="lg" full loading={busy === 'demo'} disabled={!!busy} onClick={() => submit(null, true)}>
        Try the demo account
      </Button>
      <p className="mt-8 text-center text-[15px] text-ink-2">
        New to Hisaab?{' '}
        <Link to="/signup" state={location.state} className="font-semibold text-accent-text underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthFrame>
  );
}
