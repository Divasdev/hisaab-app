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
            className="pointer-events-auto flex w-full max-w-md animate-rise items-center gap-3 rounded-xl bg-(--toast) py-2 pr-1.5 pl-4 text-[16px] text-(--toast-ink) shadow-toast"
          >
            <span className="flex-1 pt-1.5 pb-1 leading-snug">{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick();
                  dismiss();
                }}
                className="h-11 rounded-lg px-3.5 pt-0.5 font-semibold text-(--toast-action) underline decoration-[1.5px] underline-offset-4"
              >
                {toast.action.label}
              </button>
            ) : (
              <button type="button" onClick={dismiss} aria-label="Dismiss" className="grid size-11 place-items-center rounded-lg text-(--toast-ink) opacity-75">
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
