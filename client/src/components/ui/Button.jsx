const variants = {
  primary: 'bg-primary text-primary-fg hover:opacity-90',
  accent: 'bg-accent text-ink hover:opacity-90',
  outline: 'border border-line text-ink hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2',
};

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
