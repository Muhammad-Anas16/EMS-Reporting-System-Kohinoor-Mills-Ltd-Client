export function Panel({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-colors duration-200 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-400">
                <Icon className="h-[18px] w-[18px]" />
              </div>
            )}

            <div className="min-w-0">
              {title && (
                <h2 className="truncate text-sm font-semibold tracking-wide text-white">
                  {title}
                </h2>
              )}

              {subtitle && (
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {action && (
            <div className="flex shrink-0 items-center gap-2 text-neutral-400">
              {action}
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
}

export default Panel;
