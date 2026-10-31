"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CameraIcon } from "@/components/admin/icons";
import { shrink } from "@/lib/shrink";

export function PhotoPicker({ value, onChange, folder, aspect = "aspect-[4/3]" }: { value: string; onChange: (url: string) => void; folder: "menu" | "locations" | "site"; aspect?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", await shrink(file));
      form.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className={`group relative w-full ${aspect} overflow-hidden rounded-xl border-2 border-dashed border-line bg-white hover:border-rose`}
      >
        {value && <Image src={value} alt="" fill sizes="480px" className="object-cover" />}
        <span className={`absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm font-semibold ${value ? "bg-black/0 text-transparent group-hover:bg-black/40 group-hover:text-white" : "text-ink-soft"} ${busy ? "!bg-black/40 !text-white" : ""}`}>
          <CameraIcon className="w-7 h-7" />
          {busy ? "Uploading…" : value ? "Change photo" : "Add a photo"}
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p className="mt-1 text-xs text-rose-700">{error}</p>}
    </div>
  );
}
