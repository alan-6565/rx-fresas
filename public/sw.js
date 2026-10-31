// Service worker for the staff dashboard app: shows order notifications and
// opens the Orders screen when one is tapped.

// Take over as soon as a new version is out, instead of waiting for the app to
// be fully closed (a Home Screen app on the iPad may stay open for days).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "New order", body: event.data ? event.data.text() : "" };
  }
  // Reminders for the same order replace the last banner. Closing it first and
  // showing a new one (instead of reusing the tag) makes it sound again.
  event.waitUntil(
    self.registration
      .getNotifications()
      .then((open) =>
        open.forEach(
          (n) => data.tag && n.data?.group === data.tag && n.close(),
        ),
      )
      .then(() =>
        self.registration.showNotification(data.title || "New order", {
          body: data.body || "",
          tag: data.tag ? `${data.tag}-${Date.now()}` : undefined,
          icon: "/images/admin-icon-192.png",
          badge: "/images/admin-icon-192.png",
          data: { url: data.url || "/admin/orders", group: data.tag },
          requireInteraction: true,
        }),
      ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(
    event.notification.data?.url || "/admin/orders",
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((wins) => {
        const open = wins.find((w) =>
          w.url.startsWith(self.location.origin + "/admin"),
        );
        if (open) return open.focus().then((w) => w && w.navigate(url));
        return self.clients.openWindow(url);
      }),
  );
});
