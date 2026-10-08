import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, error, hint, className = '', right, ...props }, ref) {
  const id = useId();
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>}
      <div className="relative">
        <input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={`min-h-12 w-full rounded-control border bg-surface px-4 text-base outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-danger' : 'border-line'} ${right ? 'pe-12' : ''}`}
          {...props}
        />
        {right && <div className="absolute inset-y-0 end-1 flex items-center">{right}</div>}
      </div>
      {error ? <p id={`${id}-err`} className="mt-1 text-sm text-danger">{error}</p>
        : hint ? <p id={`${id}-hint`} className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
});

export default Input;
