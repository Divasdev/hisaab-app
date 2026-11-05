import { Wordmark } from './ui/Brand';

/** Simple centred frame for log in, sign up and onboarding. */
export function AuthFrame({ children }) {
  return (
    <div className="flex min-h-dvh flex-col px-5 pt-[max(28px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      <main id="main" className="mx-auto flex w-full max-w-sm flex-1 animate-enter flex-col justify-center py-8">
        <Wordmark className="mb-10" />
        {children}
      </main>
      <p className="text-center text-[13px] text-ink-3">Made by Divas Sharma</p>
    </div>
  );
}
