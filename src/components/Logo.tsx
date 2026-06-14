import { HeartPulse } from "lucide-react";

export function Logo({ className = "", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <HeartPulse className="h-5 w-5" />
      </span>
      {showText && (
        <span className="text-lg tracking-tight text-slate-900">
          Xeivora<span className="text-brand-600">Med</span>
        </span>
      )}
    </span>
  );
}
