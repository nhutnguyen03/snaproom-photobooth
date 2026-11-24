export const ENABLE_SW_ON_LOCALHOST = false;

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const host = window.location.hostname;
  const isLocalhost = host === "localhost" || host === "127.0.0.1";
  if (isLocalhost && !ENABLE_SW_ON_LOCALHOST) return;

  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch {
    // Registration is optional; the app remains usable without offline support.
  }
}
