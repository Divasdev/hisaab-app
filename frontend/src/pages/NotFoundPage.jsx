import { useTitle } from '../hooks/useTitle';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { AuthFrame } from '../components/AuthFrame';

export default function NotFoundPage() {
  useTitle('Page not found');
  return (
    <AuthFrame>
      <EmptyState icon="info" tone="tone-n" title="This page doesn't exist" className="px-0" action={<Button to="/">Go to my groups</Button>}>
        The link may be old or mistyped.
      </EmptyState>
    </AuthFrame>
  );
}
