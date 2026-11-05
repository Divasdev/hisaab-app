import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Icon } from '../components/Icon';

const ToastContext = createContext(() => {});
/** const toast = useToast(); toast('Dinner added', { action: { label: 'Undo', onClick } }) */
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(0);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback(
    (message, { action, icon = 'checkCircle', duration } = {}) => {
      clearTimeout(timer.current);
      const id = Date.now() + Math.random();
      setToast({ id, message, action, icon });
      // Toasts with Undo stay longer so there is time to react.
      timer.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), duration ?? (action ? 6000 : 3200));
    },
    [],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-6 lg:pl-[300px]"
      >
        {toast && (
          <div
            key={toast.id}
            className="glass-toast shadow-toast pointer-events-auto flex w-full max-w-md animate-enter items-center gap-3 rounded-2xl py-2.5 pr-2 pl-4 text-[15px] text-white"
          >
            <Icon name={toast.icon} size={20} className="shrink-0 text-[#9fe0bb]" />
            <span className="flex-1 py-1 leading-snug">{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick();
                  dismiss();
                }}
                className="h-9 rounded-[10px] px-3 font-semibold text-[#b9c2ff] transition-transform duration-100 active:scale-95 hover:bg-white/10"
              >
                {toast.action.label}
              </button>
            ) : (
              <button type="button" onClick={dismiss} aria-label="Dismiss" className="grid size-9 place-items-center rounded-[10px] text-white/70 hover:bg-white/10">
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
