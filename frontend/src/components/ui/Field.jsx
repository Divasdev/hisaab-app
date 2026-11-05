import { useId } from 'react';
import { cn } from '../../lib/cn';

export const inputClass =
  'h-12 w-full rounded-[10px] border-[1.5px] border-line-strong bg-surface px-3.5 pt-0.5 text-[16px] text-ink outline-none placeholder:text-ink-3 focus:border-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text aria-[invalid=true]:border-owe';

/** Label + input + hint or error. Errors are shown inline, under the field, as you type or on submit. */
export function TextField({ label, hint, error, className, inputClassName, trailing, as: Tag = 'input', ...input }) {
  const id = useId();
  const noteId = error || hint ? `${id}-note` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[15px] font-semibold text-ink">
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
        <p id={noteId} className={cn('text-[14px] leading-snug', error ? 'font-medium text-owe' : 'text-ink-2')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-[10px] border-[1.5px] border-owe px-3.5 py-2.5 text-[15px] font-medium text-owe">
      {children}
    </p>
  );
}
