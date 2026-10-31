"use client";

// Order alerts on the truck's iPad. Browsers block sound until someone taps
// the page, so `startAlerts()` runs from the "Start shift" tap.

let ctx: AudioContext | null = null;
type WakeLock = { released: boolean; addEventListener: (e: "release", f: () => void) => void };
let wakeLock: WakeLock | null = null;

export function soundOn() {
  return !!ctx && ctx.state === "running";
}

function bell(start: number, freq: number, dur: number, peak: number) {
  if (!ctx) return;
  for (const [ratio, level] of [
    [1, peak],
    [2.4, peak * 0.35],
  ] as const) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq * ratio;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur);
  }
}

/** A bright "cha-ching", played twice so it cuts through truck noise (same chime as Chismesito) */
export function playChime() {
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const offset of [0, 0.7]) {
    bell(now + offset, 1046.5, 0.16, 0.6);
    bell(now + offset + 0.12, 1318.5, 0.16, 0.6);
    bell(now + offset + 0.24, 1568, 0.32, 0.65);
  }
}

async function keepAwake() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLock> } };
    if (!nav.wakeLock || document.visibilityState !== "visible" || (wakeLock && !wakeLock.released)) return;
    wakeLock = await nav.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => (wakeLock = null));
  } catch {
    wakeLock = null;
  }
}

/** Turns on sound and keeps the screen from locking while the page is open */
export async function startAlerts() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") await ctx.resume();
  await keepAwake();
  // The screen lock is dropped whenever the app goes to the background
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void keepAwake();
      void ctx?.resume();
    }
  });
}

// ---------- Push notifications (Home Screen app) ----------

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export type PushState = "on" | "off" | "blocked" | "needs-home-screen" | "unsupported";

export async function pushState(): Promise<PushState> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return isIOS() && !isStandalone() ? "needs-home-screen" : "unsupported";
  }
  if (Notification.permission === "denied") return "blocked";
  const reg = await navigator.serviceWorker.getRegistration("/admin");
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

function urlBase64ToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** Must run from a tap. Asks permission, signs this device up and saves it */
export async function turnOnPush(): Promise<PushState> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "blocked" : "off";

  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/admin" });
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(key) }));
  const res = await fetch("/api/admin/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), label: isIOS() ? "iPad / iPhone" : navigator.platform }),
  });
  return res.ok ? "on" : "off";
}
