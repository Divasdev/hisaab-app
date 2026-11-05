import { useId } from 'react';
import { cn } from '../../lib/cn';

export const inputClass =
  'h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[16px] text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 focus:border-accent focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-owe aria-[invalid=true]:focus:ring-owe/15';

/** Label + input + hint or error. Errors are shown inline, under the field, as you type or on submit. */
export function TextField({ label, hint, error, className, inputClassName, trailing, as: Tag = 'input', ...input }) {
  const id = useId();
  const noteId = error || hint ? `${id}-note` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block px-0.5 text-[14px] font-medium text-ink-2">
        {label}
      </label>
      <div className="relative">
        <Tag
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={noteId}
          className={cn(inputClass, Tag === 'textarea' && 'h-auto min-h-24 resize-none py-3 leading-snug', trailing && 'pr-12', inputClassName)}
          {...input}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {(error || hint) && (
        <p id={noteId} className={cn('px-0.5 text-[13.5px] leading-snug', error ? 'text-owe' : 'text-ink-3')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl bg-owe-soft px-3.5 py-2.5 text-[14.5px] text-owe">
      {children}
    </p>
  );
}
