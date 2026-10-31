"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// When the site is shown inside Dashboard → Edit Website (an iframe on
// /admin), every replaceable photo gets a ✎ button. Tapping it asks the
// dashboard to open the photo picker; the dashboard does the saving, so this
// page never needs the staff login. Outside the dashboard this does nothing.

const insideDashboard = () => {
  try {
    return window.parent !== window && window.parent.location.origin === window.location.origin && window.parent.location.pathname.startsWith("/admin");
  } catch {
    return false;
  }
};

/** The original image URL, not Next's resized copy */
const realSrc = (img: HTMLImageElement | null) => {
  if (!img) return "";
  const u = new URL(img.currentSrc || img.src, location.origin);
  return u.pathname === "/_next/image" ? (u.searchParams.get("url") ?? "") : u.href;
};

export function EditLayer() {
  const pathname = usePathname();

  useEffect(() => {
    if (!insideDashboard()) return;
    const parent = window.parent;
    parent.postMessage({ type: "rx-page", path: location.pathname }, location.origin);

    const style = document.createElement("style");
    style.textContent = `
      [data-photo-slot] { outline: 3px dashed rgba(232,80,106,.55); outline-offset: -3px; }
      .rx-edit-btn { position:absolute; bottom:12px; right:12px; z-index:60; display:flex; align-items:center; gap:6px;
        padding:8px 12px; border-radius:999px; background:#fff; color:#e8506a; font:600 13px/1 system-ui,sans-serif;
        box-shadow:0 2px 10px rgba(0,0,0,.25); cursor:pointer; border:2px solid #e8506a; }
      .rx-edit-btn:hover { background:#e8506a; color:#fff; }`;
    document.head.appendChild(style);

    const decorate = () => {
      document.querySelectorAll<HTMLElement>("[data-photo-slot]").forEach((el) => {
        if (!el.dataset.photoSlot || el.querySelector(":scope > .rx-edit-btn")) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "rx-edit-btn";
        btn.innerHTML = "✎ <span>Cambiar foto</span>";
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          parent.postMessage({ type: "rx-edit-photo", slot: el.dataset.photoSlot, src: realSrc(el.querySelector("img")) }, location.origin);
        });
        el.appendChild(btn);
      });
    };
    decorate();
    const observer = new MutationObserver(decorate);
    observer.observe(document.body, { childList: true, subtree: true });

    // Show a new photo right away, before the page itself is rebuilt
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.type !== "rx-photo-updated") return;
      document.querySelectorAll<HTMLElement>(`[data-photo-slot="${CSS.escape(e.data.slot)}"] img`).forEach((img) => {
        (img as HTMLImageElement).srcset = "";
        (img as HTMLImageElement).src = e.data.url;
      });
    };
    window.addEventListener("message", onMessage);

    return () => {
      observer.disconnect();
      window.removeEventListener("message", onMessage);
      style.remove();
      document.querySelectorAll(".rx-edit-btn").forEach((b) => b.remove());
    };
  }, [pathname]);

  return null;
}
