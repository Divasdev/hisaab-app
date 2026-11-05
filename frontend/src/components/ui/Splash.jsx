import { Wordmark } from './Brand';

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg" aria-busy="true" aria-label="Loading Hisaab">
      <Wordmark className="text-[32px]" />
    </div>
  );
}
