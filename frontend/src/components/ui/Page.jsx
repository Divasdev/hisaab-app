import { useNavigate } from 'react-router';
import { cn } from '../../lib/cn';
import { useScrolled } from '../../hooks/useScrolled';
import { Icon } from '../Icon';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

export function Page({ children, className }) {
  return <div className={cn('flex min-h-dvh flex-col bg-bg', className)}>{children}</div>;
}

export function Content({ children, className }) {
  return (
    <main id="main" className={cn('mx-auto w-full max-w-2xl flex-1 px-4 pb-10 sm:px-6', className)}>
      {children}
    </main>
  );
}

/** The page's title, set in Martel like a heading written at the top of a page. */
export function LargeTitle({ children, className }) {
  return <h1 className={cn('pt-1 font-display text-[32px] leading-10 text-balance', className)}>{children}</h1>;
}

/**
 * Top bar. Solid page colour; once the page scrolls, a hairline appears under it and the small title
 * shows (the large title has scrolled away).
 */
export function TopBar({ title, back, backLabel = 'Back', left, right, alwaysShowTitle = false }) {
  const scrolled = useScrolled(4);
  const pastTitle = useScrolled(46);
  const navigate = useNavigate();
  const showTitle = alwaysShowTitle || pastTitle;
  return (
    <header className={cn('sticky top-0 z-30 border-b bg-bg pt-[env(safe-area-inset-top)]', scrolled ? 'border-line' : 'border-transparent')}>
      <div className="mx-auto grid h-14 w-full max-w-2xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2 sm:px-4">
        <div className="flex min-w-0 items-center">
          {back !== undefined && (
            <button
              type="button"
              onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
              className="flex h-11 min-w-0 items-center gap-1 rounded-lg pr-3 pl-1.5 text-[17px] font-medium text-accent-text hover:bg-accent-soft"
            >
              <Icon name="chevronLeft" size={20} strokeWidth={2.2} className="shrink-0" />
              <span className="truncate pt-0.5">{backLabel}</span>
            </button>
          )}
          {left}
        </div>
        <div
          aria-hidden={!showTitle}
          className={cn(
            'truncate pt-0.5 text-center text-[17px] font-semibold transition-opacity duration-150',
            // While hidden it takes no width, so it never squeezes the back label.
            showTitle ? 'max-w-[52vw] opacity-100 sm:max-w-sm' : 'w-0 opacity-0',
          )}
        >
          {title}
        </div>
        <div className="flex items-center justify-end gap-1">{right}</div>
      </div>
    </header>
  );
}

/**
 * Sticky bar at the bottom that holds the screen's one main action, inside thumb reach.
 * `desktop={false}` hides it on laptops, where the screen puts the action in its title row instead.
 */
export function BottomBar({ children, className, desktop = true }) {
  return (
    <div className={cn('sticky bottom-0 z-20 mt-auto', !desktop && 'lg:hidden')}>
      <div className={cn('border-t border-line bg-bg pt-3 pb-[max(12px,env(safe-area-inset-bottom))]', className)}>
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
          title={notMember ? 'You are not in this group' : 'Something went wrong'}
          action={<Button onClick={() => navigate(back)}>Go to my groups</Button>}
        >
          {error?.detail || error?.message || 'Please try again.'}
        </EmptyState>
      </Content>
    </Page>
  );
}
