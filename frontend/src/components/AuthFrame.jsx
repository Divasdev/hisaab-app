import { Wordmark } from './ui/Brand';

/**
 * Plain white page for log in, sign up, welcome, invites and "page not found".
 * The app's name and one line on what it does, then the screen's own content.
 * Phones: one column with 16px gutters. Laptops: a centred column about 400px wide.
 */
export function AuthFrame({ children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg px-4 pt-[max(24px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] sm:px-6">
      <main id="main" className="mx-auto flex w-full max-w-[400px] flex-1 flex-col pt-4 pb-10 sm:justify-center sm:py-12">
        <header>
          <Wordmark className="text-[32px]" />
          <p className="mt-3 text-[16px] leading-6 text-ink-2">Split expenses with friends. Settle up with UPI.</p>
        </header>
        {children}
      </main>
      <p className="mx-auto w-full max-w-[400px] text-[14px] text-ink-2">Made by Divas Sharma</p>
    </div>
  );
}
