// Renders before/after screenshots of a sample app page for the aligned diff
// tests. Run with `pnpm generate:fixtures` from packages/diff-analysis.
// Set CHROMIUM_PATH to use a browser other than Playwright's bundled one.
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../src/__tests__/fixtures/aligned");

const LOREM =
  "Visual regression testing captures screenshots of every component and compares them with an approved baseline, so unexpected changes are caught before they ship.";

const defaults = {
  banner: null,
  sidebarWidth: 200,
  headerAction: "Invite",
  headerBadge: false,
  heading: "Project overview",
  intro: LOREM,
  introExtra: "",
  cards: ["Builds", "Snapshots", "Reviews", "Members", "Storage", "Billing"],
  cardColor: "#2563eb",
  tallSection: false,
  toolbarColor: "#e5e7eb",
  statusDot: "#16a34a",
  footer: "© 2026 Example Co. All rights reserved.",
  dark: false,
  activity: "Build #42 passed",
};

const renderPage = (o) => `<!doctype html>
<html><head><style>
  * { box-sizing: border-box; margin: 0; }
  body { font: 14px/1.5 "DejaVu Sans", sans-serif; width: 900px; background: ${o.dark ? "#111827" : "#fff"}; color: ${o.dark ? "#f9fafb" : "#111827"}; -webkit-font-smoothing: antialiased; }
  .banner { background: #fef3c7; color: #92400e; padding: 12px 24px; border-bottom: 1px solid #fcd34d; }
  header { display: flex; align-items: center; justify-content: space-between; height: 56px; padding: 0 24px; border-bottom: 1px solid #e5e7eb; }
  header .logo { font-weight: 700; font-size: 18px; }
  header .actions { display: flex; gap: 8px; align-items: center; }
  .btn { background: #111827; color: #fff; padding: 6px 14px; border-radius: 6px; }
  .badge { background: #dc2626; color: #fff; border-radius: 999px; padding: 0 8px; font-size: 12px; }
  .layout { display: flex; }
  nav { width: ${o.sidebarWidth}px; flex: none; padding: 16px; border-right: 1px solid #e5e7eb; min-height: 760px; }
  nav a { display: block; padding: 6px 8px; color: inherit; text-decoration: none; }
  main { width: 500px; flex: none; padding: 24px; }
  aside { flex: 1; min-width: 0; padding: 16px; border-left: 1px solid #e5e7eb; }
  .toolbar { height: 36px; background: ${o.toolbarColor}; border-radius: 6px; margin: 16px 0; display: flex; align-items: center; padding: 0 12px; gap: 8px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: ${o.statusDot}; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; height: 90px; }
  .card b { color: ${o.cardColor}; }
  .tall { height: 320px; margin: 16px 0; border-radius: 8px; background: linear-gradient(135deg, #a5b4fc, #f9a8d4); }
  footer { border-top: 1px solid #e5e7eb; padding: 16px 24px; color: #6b7280; }
</style></head><body>
  ${o.banner ? `<div class="banner">${o.banner}</div>` : ""}
  <header><div class="logo">Acme Studio</div><div class="actions">${o.headerBadge ? '<span class="badge">3</span>' : ""}<span class="btn">${o.headerAction}</span></div></header>
  <div class="layout">
    <nav>${["Dashboard", "Projects", "Builds", "Settings", "Help"].map((label) => `<a>${label}</a>`).join("")}</nav>
    <main>
      <h1>${o.heading}</h1>
      <p>${o.intro}${o.introExtra}</p>
      <div class="toolbar"><span class="dot"></span><span>All systems operational</span></div>
      ${o.tallSection ? '<div class="tall"></div>' : ""}
      <div class="grid">${o.cards.map((title, index) => `<div class="card"><b>${title}</b><div>${(index + 1) * 12} items</div></div>`).join("")}</div>
      <p style="margin-top:16px">${LOREM}</p>
    </main>
    <aside><b>Activity</b><p>Baseline approved</p><p>${o.activity}</p></aside>
  </div>
  <footer>${o.footer}</footer>
</body></html>`;

export const scenarios = {
  "insert-top-banner": { banner: "Scheduled maintenance on Sunday at 02:00 UTC." },
  "change-bottom-footer": { footer: "© 2026 Example Co. All rights reserved. Terms · Privacy" },
  "change-left-sidebar-wider": { sidebarWidth: 240 },
  "change-right-panel-text": { activity: "Build #43 failed" },
  "change-right-header-badge": { headerBadge: true },
  "tall-inserted-section": { tallSection: true },
  "wide-toolbar-color": { toolbarColor: "#fde68a" },
  "text-word-change": { intro: LOREM.replace("unexpected", "unintended") },
  "text-reflow-extra-line": {
    introExtra: " Reviewers approve or reject each change from the build page.",
  },
  "small-status-dot": { statusDot: "#dc2626" },
  "big-dark-theme": { dark: true },
  "removed-cards-row": { cards: defaults.cards.slice(0, 3) },
  "card-color-change": { cardColor: "#7c3aed" },
  "multiple-changes": {
    banner: "Scheduled maintenance on Sunday at 02:00 UTC.",
    headerAction: "Share",
    footer: "© 2026 Example Co.",
  },
};

const main = async () => {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const page = await browser.newPage({
    viewport: { width: 900, height: 600 },
    deviceScaleFactor: 1,
  });
  const shoot = async (options, file) => {
    await page.setContent(renderPage({ ...defaults, ...options }));
    await mkdir(dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: true });
  };

  await shoot({}, join(OUT_DIR, "baseline.png"));
  for (const [name, options] of Object.entries(scenarios)) {
    await shoot(options, join(OUT_DIR, `${name}.png`));
  }
  await browser.close();
};

await main();
