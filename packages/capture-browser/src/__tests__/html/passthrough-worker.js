// Fetches requests to other origins itself, like msw does for requests it doesn't mock.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (new URL(event.request.url).origin === self.location.origin) {
    return;
  }
  event.respondWith(
    fetch(event.request).then(async (response) =>
      response.type === "opaque"
        ? response
        : new Response(`service worker: ${await response.text()}`, { status: response.status }),
    ),
  );
});
