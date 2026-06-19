// XeivoraMed X-pulse mark — a rounded-square deep-blue badge with a white "X" of
// four rounded strokes and a coral heartbeat line through the centre. Matches the
// marketing site (xeivora.com).
export function Logo({ className = "", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-semibold ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-brand-600">
        <svg width="22" height="22" viewBox="0 0 40 40" aria-hidden="true">
          <g transform="translate(20,20)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="#FFFFFF" strokeWidth="3.5" d="M-11 -11 L-4 -3.5" />
            <path stroke="#FFFFFF" strokeWidth="3.5" d="M11 -11 L4 -3.5" />
            <path stroke="#FFFFFF" strokeWidth="3.5" d="M-11 11 L-4 3.5" />
            <path stroke="#FFFFFF" strokeWidth="3.5" d="M11 11 L4 3.5" />
            <path stroke="#FF6B5E" strokeWidth="2.8" d="M-14 0 L-5 0 L-2.5 -5.5 L2 5.5 L4.5 0 L14 0" />
          </g>
        </svg>
      </span>
      {showText && (
        <span className="text-lg tracking-tight text-ink">
          Xeivora<span className="text-coral">Med</span>
        </span>
      )}
    </span>
  );
}
