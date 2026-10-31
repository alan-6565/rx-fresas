// Service worker for the staff dashboard app: shows order notifications and
// opens the Orders screen when one is tapped.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "New order", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "New order", {
      body: data.body || "",
      tag: data.tag,
      icon: "/images/admin-icon-192.png",
      badge: "/images/admin-icon-192.png",
      data: { url: data.url || "/admin/orders" },
      requireInteraction: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin/orders", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => w.url.startsWith(self.location.origin + "/admin"));
      if (open) return open.focus().then((w) => w && w.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
