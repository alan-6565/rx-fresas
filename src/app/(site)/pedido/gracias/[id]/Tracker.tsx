"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Photo } from "@/components/ui";

const REFRESH_MS = 20000;
const STEPS = ["Recibido", "Preparando", "En camino", "Entregado"];
const STEP_OF: Record<string, number> = { new: 0, preparing: 1, ready: 1, out_for_delivery: 2, delivered: 3, picked_up: 3 };

/** Where a delivery is right now; keeps itself up to date until it arrives */
export function Tracker({ status, photoUrl }: { status: string; photoUrl: string | null }) {
  const router = useRouter();
  const cancelled = status === "cancelled";
  const current = STEP_OF[status] ?? 0;
  const done = cancelled || current === STEPS.length - 1;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(t);
  }, [done, router]);

  if (cancelled) {
    return <p className="mt-8 rounded-3xl border border-rose/30 bg-blush/60 p-5 font-semibold">Este pedido se canceló y te devolvimos tu dinero.</p>;
  }

  return (
    <div className="mt-8 rounded-3xl border border-line bg-white p-5">
      <ol className="grid grid-cols-4 gap-1" aria-label="Estado de tu entrega">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === current ? "step" : undefined} className="text-center">
            <span className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${i <= current ? "bg-rose text-white" : "bg-blush text-ink-soft"}`}>{i < current || done ? "✓" : i + 1}</span>
            <span className={`mt-2 block text-xs sm:text-sm ${i === current ? "font-bold text-ink" : "text-ink-soft"}`}>{label}</span>
          </li>
        ))}
      </ol>
      {photoUrl && <Photo src={photoUrl} alt="Foto de tu entrega" className="mt-5 h-72 w-full rounded-2xl" sizes="(max-width: 640px) 100vw, 560px" />}
    </div>
  );
}
