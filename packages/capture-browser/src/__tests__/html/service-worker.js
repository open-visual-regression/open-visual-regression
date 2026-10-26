// Answers /api/data after a delay, like an msw handler.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (new URL(event.request.url).pathname === "/api/data") {
    event.respondWith(
      new Promise((resolve) => setTimeout(() => resolve(new Response("done")), 400)),
    );
  }
});
