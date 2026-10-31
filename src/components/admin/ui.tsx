import { HeartDoodle } from "@/components/admin/icons";

/** "Orders ♡" page title with subtitle and a right-hand slot, like the mockup */
export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 font-hand text-5xl leading-none text-ink">
          {title}
          <HeartDoodle className="w-8 h-8 text-rose rotate-12" />
        </h1>
        {sub && <p className="mt-2 text-ink-soft">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-2xl bg-white border border-line shadow-[0_1px_3px_rgba(74,29,36,0.06)] ${className}`}>{children}</section>;
}

export const STATUS = {
  new: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  preparing: { label: "Preparing", cls: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  ready: { label: "Ready", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  picked_up: { label: "Picked Up", cls: "bg-lime-50 text-lime-700 border-lime-200", dot: "bg-lime-600" },
  cancelled: { label: "Cancelled", cls: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
} as const;
export type Status = keyof typeof STATUS;

export function StatusPill({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/** The pink on/off switch from the mockup's menu cards and hours list */
export function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange: (on: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? "bg-rose" : "bg-[#e6d6d4]"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export const field = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-rose";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

/** Centered dialog on wide screens, full-height sheet on phones */
export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 sm:p-6" onClick={onClose}>
      <div className="flex max-h-[100dvh] sm:max-h-[90vh] w-full sm:max-w-lg flex-col bg-cream sm:rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-hand text-3xl leading-none">{title}</p>
          <button onClick={onClose} aria-label="Close" className="p-1 text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-5 py-4">{footer}</div>
      </div>
    </div>
  );
}

export const btn = {
  primary: "rounded-xl bg-rose hover:bg-rose-dark disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5",
  ghost: "rounded-xl border border-line bg-white hover:border-rose disabled:opacity-50 text-sm font-semibold px-4 py-2.5",
  danger: "rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 text-sm font-semibold px-4 py-2.5",
};
