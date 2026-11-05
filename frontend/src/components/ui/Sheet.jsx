import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { animateSpring, project, prefersReducedMotion, rubberband } from '../../lib/spring';
import { cn } from '../../lib/cn';
import { Icon } from '../Icon';

/**
 * Bottom sheet on a solid surface.
 * - opens with a critically damped spring (no bounce)
 * - drag the top area down to close; the finger's speed is handed to the closing spring
 * - a flick is projected forward (like iOS) to decide close vs. snap back
 * - dragging up past the top rubber-bands instead of stopping hard
 * - can be grabbed mid-animation; every animation starts from the current position
 * - Escape closes, focus stays inside while open and returns to the trigger after
 */
export function Sheet({ open, onClose, title, description, children, footer, className }) {
  const [mounted, setMounted] = useState(open);
  const panel = useRef(null);
  const scrim = useRef(null);
  const y = useRef(0);
  const v = useRef(0);
  const anim = useRef(null);
  const drag = useRef(null);
  const entering = useRef(open);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  const height = () => panel.current?.offsetHeight || 600;

  const apply = (value) => {
    y.current = value;
    if (panel.current) panel.current.style.transform = `translate3d(0, ${value}px, 0)`;
    if (scrim.current) scrim.current.style.opacity = String(Math.min(1, Math.max(0, 1 - value / height())));
  };

  const animateTo = (target, { velocity = v.current, damping = 1, response = 0.36, done } = {}) => {
    anim.current?.stop();
    if (prefersReducedMotion()) {
      apply(target);
      v.current = 0;
      done?.();
      return;
    }
    anim.current = animateSpring({
      from: y.current,
      to: target,
      velocity,
      damping,
      response,
      onUpdate: (x, vel) => {
        v.current = vel;
        apply(x);
      },
      onComplete: () => {
        anim.current = null;
        done?.();
      },
    });
  };

  useEffect(() => {
    if (open && !mounted) {
      entering.current = true;
      setMounted(true);
    }
  }, [open, mounted]);

  useLayoutEffect(() => {
    if (!mounted) return;
    if (open) {
      if (entering.current) {
        entering.current = false;
        v.current = 0;
        apply(height());
      }
      animateTo(0, { damping: 1, response: 0.38 });
    } else {
      animateTo(height(), { damping: 1, response: 0.3, done: () => setMounted(false) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  useEffect(() => () => anim.current?.stop(), []);

  // Keyboard, focus and scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => {
      const target = panel.current?.querySelector('[data-autofocus]') || panel.current;
      target?.focus({ preventScroll: true });
    });
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
      }
      if (e.key === 'Tab' && panel.current) {
        const nodes = panel.current.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),textarea,select,[tabindex]:not([tabindex="-1"])');
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
    };
  }, [open]);

  const onPointerDown = (e) => {
    if (e.button !== 0 || e.target.closest('button, a, input, textarea, select')) return;
    anim.current?.stop();
    drag.current = { id: e.pointerId, startY: e.clientY, startOffset: y.current, moved: false, history: [{ t: e.timeStamp, y: e.clientY }] };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dy) < 4) return;
    d.moved = true;
    let next = d.startOffset + dy;
    if (next < 0) next = rubberband(next, height());
    apply(next);
    d.history.push({ t: e.timeStamp, y: e.clientY });
    if (d.history.length > 8) d.history.shift();
  };

  const onPointerUp = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const last = d.history[d.history.length - 1];
    const recent = d.history.filter((p) => last.t - p.t < 100);
    const first = recent[0];
    const dt = (last.t - first.t) / 1000;
    const velocity = dt > 0 ? (last.y - first.y) / dt : 0;
    v.current = velocity;
    if (d.moved && y.current + project(velocity) > height() * 0.45) {
      onCloseRef.current?.();
    } else {
      // Snap back. A little bounce is fine here because the finger carried momentum.
      animateTo(0, { velocity, damping: 0.82, response: 0.32 });
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div ref={scrim} aria-hidden="true" className="absolute inset-0 bg-[var(--scrim)] opacity-0" onClick={() => onCloseRef.current?.()} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto flex max-h-[min(90dvh,780px)] w-full max-w-lg flex-col rounded-t-2xl border-t border-line bg-surface shadow-sheet outline-none will-change-transform',
          'sm:bottom-4 sm:w-[calc(100%-32px)] sm:rounded-2xl sm:border',
          className,
        )}
      >
        <div
          className="shrink-0 cursor-grab touch-none px-5 pt-2 select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-sm bg-line-strong" />
          {title && (
            <div className="flex items-start gap-3 pb-4">
              <div className="min-w-0 flex-1 pt-1">
                <h2 id={titleId} className="font-display text-[22px] leading-8">
                  {title}
                </h2>
                {description && <p className="mt-1 text-[15px] leading-snug text-ink-2">{description}</p>}
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => onCloseRef.current?.()}
                className="-mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-sunken hover:text-ink"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-line px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">{footer}</div>
        ) : (
          <div className="shrink-0 pb-[env(safe-area-inset-bottom)]" />
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Small confirm sheet, only for actions that can't be undone (leave group, remove member). */
export function ConfirmSheet({ open, onClose, title, children, confirmLabel, onConfirm, busy, error }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="grid gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="h-14 rounded-xl bg-owe pt-0.5 text-[18px] font-semibold text-white disabled:opacity-50 dark:text-[#121316]"
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
          <button type="button" onClick={onClose} className="h-12 rounded-[10px] pt-0.5 text-[16px] font-semibold text-ink-2 hover:bg-sunken">
            Cancel
          </button>
        </div>
      }
    >
      <div className="text-[16px] leading-relaxed text-ink-2">{children}</div>
      {error && <p className="mt-3 rounded-[10px] border-[1.5px] border-owe px-3.5 py-2.5 text-[15px] font-medium text-owe">{error}</p>}
    </Sheet>
  );
}
