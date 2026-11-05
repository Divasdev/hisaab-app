import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { UPI_ID_PATTERN } from '../lib/upi';
import { AuthFrame } from '../components/AuthFrame';
import { Button } from '../components/ui/Button';
import { FormError, TextField } from '../components/ui/Field';
import { LargeTitle } from '../components/ui/Page';

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
      <LargeTitle className="mt-10">Welcome, {user?.name.split(' ')[0]}</LargeTitle>
      <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
        Add your UPI ID. When a friend settles up with you, Hisaab opens their UPI app with your ID and the exact amount already filled in.
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
        <Button variant="quiet" size="md" full onClick={done}>
          Skip for now
        </Button>
      </form>
    </AuthFrame>
  );
}
