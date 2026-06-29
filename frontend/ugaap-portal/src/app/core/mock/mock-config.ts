// ── Mock Mode Toggle ─────────────────────────────────────────────────────────
//
// This is the ONLY file you need to touch to switch between mock and real data.
//
//   USE_MOCK = true  → services return local fake data; no backend needed.
//   USE_MOCK = false → services call the real API at localhost:8083.
//
// Flip the flag, save, and the app hot-reloads instantly.
// ─────────────────────────────────────────────────────────────────────────────

export const USE_MOCK = true;
