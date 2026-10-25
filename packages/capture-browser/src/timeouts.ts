export const BOOT_TIMEOUT_MS = 10_000;
export const RENDER_TIMEOUT_MS = 30_000;
export const SETTLE_TIMEOUT_MS = 5_000;
export const NETWORK_QUIET_WINDOW_MS = 100;
export const DOM_QUIET_WINDOW_MS = 150;
// A story that keeps changing its DOM, like a JS-driven spinner, gives up after this instead of
// spending its whole settle budget.
export const DOM_SETTLE_TIMEOUT_MS = 2_000;
