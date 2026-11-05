import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../lib/money';
import { timeAgo } from '../../lib/dates';
import { Icon } from '../../components/Icon';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';

/** Details of one payment, with a way to remove it if it was marked by mistake (with Undo). */
export function PaymentSheet({ payment, people, meId, onClose }) {
  const toast = useToast();
  const [shown, setShown] = useState(payment);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (payment) setShown(payment);
  }, [payment]);
  const p = payment || shown;

  async function remove() {
    setBusy(true);
    try {
      await api.deleteSettlement(p.id);
      onClose();
      const { group_id, from_member_id, to_member_id, amount_paise, method } = p;
      toast(`Removed the ${formatINR(amount_paise)} payment`, {
        icon: 'trash',
        action: { label: 'Undo', onClick: () => api.createSettlement(group_id, { from_member_id, to_member_id, amount_paise, method }) },
      });
    } catch (err) {
      toast(err.detail || err.message, { icon: 'info' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={!!payment} onClose={onClose} title="Payment">
      {p && (
        <div className="pb-1">
          <div className="flex items-center justify-center gap-3 py-4">
            <Person user={people.get(p.from_member_id)} label={people.first(p.from_member_id)} />
            <Icon name="arrowRight" size={22} className="mb-6 text-ink-3" />
            <Person user={people.get(p.to_member_id)} label={people.first(p.to_member_id)} />
          </div>
          <p className="text-center text-[34px] font-bold tracking-[-0.03em] tabular-nums">{formatINR(p.amount_paise)}</p>
          <p className="mt-1 text-center text-[14px] text-ink-2">
            {p.method === 'cash' ? 'Cash or other' : 'UPI'} · marked as paid {timeAgo(p.created_at)}
          </p>
          <Button variant="danger" full className="mt-6" loading={busy} onClick={remove} icon={<Icon name="trash" size={18} />}>
            Remove this payment
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function Person({ user, label }) {
  return (
    <span className="flex w-20 flex-col items-center gap-1.5">
      <Avatar user={user} size="lg" />
      <span className="max-w-full truncate text-[14px] font-medium">{label}</span>
    </span>
  );
}
