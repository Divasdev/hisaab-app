import { BrandMark } from './Brand';

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center" aria-busy="true" aria-label="Loading Hisaab">
      <div className="animate-fade">
        <BrandMark size="lg" />
      </div>
    </div>
  );
}
