"use client";

import Image from "next/image";
import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) {
      const from = new URLSearchParams(window.location.search).get("from");
      window.location.href = from?.startsWith("/admin") ? from : "/admin";
    } else {
      setError("Wrong password. Try again.");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-blush px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-cream shadow-xl p-8 text-center">
        <div className="relative mx-auto w-28 h-28 rounded-full overflow-hidden ring-4 ring-white shadow-md">
          <Image src="/images/logo-v2.png" alt="R&X Fresas con Crema" fill sizes="112px" className="object-cover" priority />
        </div>
        <h1 className="mt-5 font-hand text-5xl">Staff Login</h1>
        <p className="mt-1 text-sm text-ink-soft">R&X Fresas con Crema dashboard</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          autoComplete="current-password"
          className="mt-6 w-full rounded-xl border border-line bg-white px-4 py-3 focus:outline-none focus:border-rose"
        />
        {error && <p role="alert" className="mt-2 text-sm text-rose-dark">{error}</p>}
        <button disabled={busy || !password} className="mt-4 w-full rounded-xl bg-rose hover:bg-rose-dark disabled:bg-line text-white font-bold py-3 transition-colors">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
