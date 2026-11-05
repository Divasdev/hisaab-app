import { useRef } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../Icon';

/** iOS-style segmented control. The white thumb slides to the selected option. Arrow keys work. */
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
      className={cn('relative grid rounded-xl bg-sunken p-[3px]', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute top-[3px] bottom-[3px] left-[3px] rounded-[10px] bg-surface shadow-lift transition-transform duration-300 ease-out-soft dark:bg-[#34353c]"
        style={{ width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => (refs.current[i] = el)}
          id={idPrefix ? `${idPrefix}-tab-${o.value}` : undefined}
          role="tab"
          type="button"
          aria-selected={i === index}
          aria-controls={idPrefix ? `${idPrefix}-panel` : undefined}
          tabIndex={i === index ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cn(
            'relative z-10 flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-[10px] px-2 text-[14px] font-semibold transition-colors duration-200',
            i === index ? 'text-ink' : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.icon && <Icon name={o.icon} size={16} />}
          <span className="truncate">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
