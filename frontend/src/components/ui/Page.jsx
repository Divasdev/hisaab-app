import { useNavigate } from 'react-router';
import { cn } from '../../lib/cn';
import { useScrolled } from '../../hooks/useScrolled';
import { Icon } from '../Icon';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

export function Page({ children, className }) {
  return <div className={cn('flex min-h-dvh flex-col', className)}>{children}</div>;
}

export function Content({ children, className }) {
  return (
    <main id="main" className={cn('mx-auto w-full max-w-2xl flex-1 animate-enter px-4 pb-10 sm:px-6', className)}>
      {children}
    </main>
  );
}

export function LargeTitle({ children, className }) {
  return <h1 className={cn('px-1 pt-1 text-[32px] leading-[1.1] font-bold tracking-[-0.025em] text-balance', className)}>{children}</h1>;
}

/**
 * Top bar. Transparent at the top of the page; once content scrolls under it, it turns into frosted glass
 * and the small title fades in (the large title has scrolled away). Like iOS navigation bars.
 */
export function TopBar({ title, back, backLabel = 'Back', left, right, alwaysShowTitle = false }) {
  const scrolled = useScrolled(4);
  const pastTitle = useScrolled(46);
  const navigate = useNavigate();
  const showTitle = alwaysShowTitle || pastTitle;
  return (
    <header
      className={cn(
        'sticky top-0 z-30 pt-[env(safe-area-inset-top)] transition-[background-color,border-color,backdrop-filter] duration-200',
        scrolled ? 'glass-bar border-b border-[var(--glass-line)]' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto grid h-14 w-full max-w-2xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2 sm:px-4">
        <div className="flex min-w-0 items-center">
          {back !== undefined && (
            <button
              type="button"
              onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
              className="flex h-10 min-w-0 items-center gap-0.5 rounded-xl pr-2.5 pl-1 text-[17px] text-accent-text transition-[transform,background-color] hover:bg-sunken active:scale-95"
            >
              <Icon name="chevronLeft" size={26} strokeWidth={2.1} className="shrink-0" />
              <span className="truncate">{backLabel}</span>
            </button>
          )}
          {left}
        </div>
        <div
          aria-hidden={!showTitle}
          className={cn(
            'max-w-[52vw] truncate text-center text-[17px] font-semibold tracking-[-0.01em] transition-[opacity,transform] duration-200 sm:max-w-sm',
            showTitle ? 'opacity-100' : 'translate-y-1 opacity-0',
          )}
        >
          {title}
        </div>
        <div className="flex items-center justify-end gap-1">{right}</div>
      </div>
    </header>
  );
}

/** Sticky frosted bar at the bottom that holds the screen's one main action, inside thumb reach. */
export function BottomBar({ children, className }) {
  return (
    <div className="sticky bottom-0 z-20 mt-auto">
      <div className={cn('glass-bar border-t border-[var(--glass-line)] pt-3 pb-[max(12px,env(safe-area-inset-bottom))]', className)}>
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

/** Full-page error with a way out (never trap the user). */
export function ErrorPage({ error, back = '/' }) {
  const navigate = useNavigate();
  const notMember = error?.status === 403;
  return (
    <Page>
      <TopBar back={back} backLabel="Groups" />
      <Content>
        <EmptyState
          icon={notMember ? 'shield' : 'info'}
          tone="tone-n"
          title={notMember ? 'You are not in this group' : 'Something went wrong'}
          action={<Button onClick={() => navigate(back)}>Go to my groups</Button>}
        >
          {error?.detail || error?.message || 'Please try again.'}
        </EmptyState>
      </Content>
    </Page>
  );
}
