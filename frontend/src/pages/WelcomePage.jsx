import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { UPI_ID_PATTERN } from '../lib/upi';
import { AuthFrame } from '../components/AuthFrame';
import { Button } from '../components/ui/Button';
import { FormError, TextField } from '../components/ui/Field';
import { Tile } from '../components/ui/Tile';

/** Right after sign up: ask for the UPI ID, so friends can pay this person back in one tap. Skippable. */
export default function WelcomePage() {
  useTitle('Add your UPI ID');
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [upi, setUpi] = useState(user?.upi_id || '');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const looksWrong = upi.trim() && !UPI_ID_PATTERN.test(upi.trim());
  const done = () => navigate(location.state?.from || '/', { replace: true });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ upi_id: upi });
      done();
    } catch (err) {
      setError(err.detail || err.message);
      setBusy(false);
    }
  }

  return (
    <AuthFrame>
      <Tile icon="smartphone" tone="tone-accent" size="lg" />
      <h1 className="mt-5 text-[30px] leading-tight font-bold tracking-[-0.025em]">Add your UPI ID</h1>
      <p className="mt-2 text-[16px] leading-relaxed text-ink-2">
        When a friend settles up with you, Hisaab opens their UPI app with your ID and the exact amount already filled in.
      </p>
      <form onSubmit={save} className="mt-8 space-y-4" noValidate>
        <TextField
          label="UPI ID"
          placeholder="yourname@okaxis"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          value={upi}
          onChange={(e) => setUpi(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && looksWrong ? 'That does not look like a UPI ID. It should look like name@bank.' : ''}
          hint="Find it in GPay, PhonePe or Paytm, under your profile."
        />
        <FormError>{error}</FormError>
        <Button type="submit" size="lg" full loading={busy} disabled={!upi.trim() || looksWrong}>
          Save and continue
        </Button>
        <Button variant="ghost" size="lg" full onClick={done}>
          Skip for now
        </Button>
      </form>
    </AuthFrame>
  );
}
