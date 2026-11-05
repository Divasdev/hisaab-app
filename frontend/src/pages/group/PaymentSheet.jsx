import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../lib/money';
import { timeAgo } from '../../lib/dates';
import { Icon } from '../../components/Icon';
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
    <Sheet
      open={!!payment}
      onClose={onClose}
      title={p ? `${people.first(p.from_member_id)} paid ${people.first(p.to_member_id, true)}` : 'Payment'}
    >
      {p && (
        <div className="pb-1">
          <p className="tabular font-display text-[44px] leading-[1.15] text-accent-text">{formatINR(p.amount_paise)}</p>
          <p className="mt-2 text-[15px] leading-6 text-ink-2">
            {p.method === 'cash' ? 'Cash or other' : 'UPI'} · marked as paid {timeAgo(p.created_at)}
          </p>
          <Button variant="danger" full className="mt-7" loading={busy} onClick={remove} icon={<Icon name="trash" size={18} />}>
            Remove this payment
          </Button>
        </div>
      )}
    </Sheet>
  );
}
