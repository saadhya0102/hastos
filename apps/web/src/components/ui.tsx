import clsx from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/60",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
        variant === "primary" && "bg-accent text-accent-fg hover:opacity-90",
        variant === "ghost" && "hover:bg-surface2 text-fg",
        variant === "outline" && "border border-border hover:bg-surface2 text-fg",
        variant === "danger" && "bg-bad text-white hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-xl border border-border bg-surface", className)}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "ok" | "bad" | "warn" | "info" | "accent";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border",
        tone === "default" && "bg-surface2 border-border text-muted",
        tone === "ok" && "bg-ok/15 border-ok/40 text-ok",
        tone === "bad" && "bg-bad/15 border-bad/40 text-bad",
        tone === "warn" && "bg-warn/15 border-warn/40 text-warn",
        tone === "info" && "bg-info/15 border-info/40 text-info",
        tone === "accent" && "bg-accent/15 border-accent/40 text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      aria-hidden
    />
  );
}

export function ProgressRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} className="stroke-border" strokeWidth={4} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="stroke-accent"
        strokeWidth={4}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
      <p className="font-medium text-fg">{title}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
    </div>
  );
}

/** A compact stat tile: big value + label, optional sub-line and accent. */
export function Stat({
  label,
  value,
  sub,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "accent" | "ok" | "warn" | "info";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border bg-surface p-5 transition-colors",
        tone === "accent" && "border-accent/30",
        className,
      )}
    >
      <p className="text-sm text-muted">{label}</p>
      <p
        className={clsx(
          "mt-1 text-3xl font-bold tabular-nums",
          tone === "accent" && "text-accent",
          tone === "ok" && "text-ok",
          tone === "warn" && "text-warn",
          tone === "info" && "text-info",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Horizontal progress bar (value 0..1). */
export function LinearBar({
  value,
  className,
  tone = "accent",
}: {
  value: number;
  className?: string;
  tone?: "accent" | "ok" | "info";
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={clsx("h-2 w-full overflow-hidden rounded-full bg-surface2", className)}>
      <div
        className={clsx(
          "h-full rounded-full transition-[width] duration-500",
          tone === "accent" && "bg-accent",
          tone === "ok" && "bg-ok",
          tone === "info" && "bg-info",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Section heading with an optional trailing action (e.g., a "View all" link). */
export function SectionHeading({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mb-3 flex items-center justify-between", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {action}
    </div>
  );
}
