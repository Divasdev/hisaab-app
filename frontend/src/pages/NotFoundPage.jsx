import { useTitle } from '../hooks/useTitle';
import { Button } from '../components/ui/Button';
import { LargeTitle } from '../components/ui/Page';
import { AuthFrame } from '../components/AuthFrame';

export default function NotFoundPage() {
  useTitle('Page not found');
  return (
    <AuthFrame>
      <LargeTitle className="mt-10">Page not found</LargeTitle>
      <p className="mt-2 text-[16px] leading-relaxed text-ink-2">The link may be old or mistyped.</p>
      <Button to="/" size="lg" full className="mt-8">
        Go to my groups
      </Button>
    </AuthFrame>
  );
}
