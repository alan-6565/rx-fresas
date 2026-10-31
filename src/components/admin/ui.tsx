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
