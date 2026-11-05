import { useRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * Tabs written as words on a line; the chosen one is underlined in ballpoint blue. Arrow keys work.
 * (`icon` on options is ignored: words only.)
 */
export function Segmented({ options, value, onChange, label, className, idPrefix }) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const refs = useRef([]);
  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('grid border-b border-line', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o, i) => {
        const on = i === index;
        return (
          <button
            key={o.value}
            ref={(el) => (refs.current[i] = el)}
            id={idPrefix ? `${idPrefix}-tab-${o.value}` : undefined}
            role="tab"
            type="button"
            aria-selected={on}
            aria-controls={idPrefix ? `${idPrefix}-panel` : undefined}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              '-mb-px flex h-12 min-w-0 items-center justify-center border-b-[2.5px] px-2 pt-1 text-[15px]',
              on ? 'border-accent-text font-semibold text-ink' : 'border-transparent font-medium text-ink-2 hover:text-ink',
            )}
          >
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
