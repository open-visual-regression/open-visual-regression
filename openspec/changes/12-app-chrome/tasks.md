# 12 · App chrome + layout groups

Gate: authenticated routes show TopBar + correct sidebar at all three breakpoints; public routes (login/setup/invite) show minimal centered layout; unauthenticated visit to a protected route redirects to /login.

Read: `openspec/designs/screens/open-visual-regression/project/kit/chrome.jsx`
Read: `openspec/designs/screens/open-visual-regression/project/kit/chrome-tablet.jsx`
Read: `openspec/designs/screens/open-visual-regression/project/kit/chrome-mobile.jsx`

Layout hierarchy established in this PR:
```
app/
  layout.tsx                 root — HTML, fonts, ThemeProvider, globals.css
  (public)/
    layout.tsx               centered card wrapper, no chrome
    (setup, login, invite pages go here)
  (app)/
    layout.tsx               full chrome — TopBar + Sidebar + content insets
                             server-side session guard: no session → redirect /login
    (all authenticated pages go here)
```

- [ ] 1.1 Update `apps/web/app/layout.tsx` (root):
  - Load JetBrains Mono via `next/font/local` (point to `node_modules/@fontsource-variable/jetbrains-mono`)
  - `<html lang="en" className="dark">`
  - Wrap body with `ThemeProvider` from `next-themes` (`defaultTheme: "dark"`, `attribute: "class"`, `storageKey: "ovr-theme"`)
  - Import `@ovr/ui/globals.css`

- [ ] 1.2 Create `apps/web/app/(public)/layout.tsx`:
  - Minimal full-height centered flex container; `var(--background)` bg
  - No topbar, no sidebar — just `{children}` centered on screen

- [ ] 1.3 Create `apps/web/app/(app)/layout.tsx`:
  - Server Component; call `auth.api.getSession({ headers })` → no session → `redirect("/login")`
  - Render `<TopBar />` + `<Sidebar />` (hidden <1024px) + `<TabletSidebar />` (768–1023px) + `<MobileChrome />`
  - Content area: `paddingTop: var(--topbar-h)`; `paddingLeft: var(--sidebar-w)` on ≥1024px; `paddingLeft: 48px` on tablet; `paddingBottom: 56px` on mobile

- [ ] 1.4 Create `apps/web/components/chrome/TopBar.tsx` (RSC):
  - 48px fixed top; z-index above content; `var(--ovr-bg-elevated)` bg; 1px `var(--ovr-border-default)` bottom
  - Left: `OvrMark` size=22 + "ovr" wordmark (amber) + `|` separator + breadcrumb slot
  - Right: branch button (secondary variant, small) + user avatar (24×24 square, 2-letter monogram, `var(--ovr-accent-primary)` bg)
  - Avatar opens DropdownMenu: "settings" link + separator + "sign out" button

- [ ] 1.5 Create `apps/web/components/chrome/Sidebar.tsx` (RSC, desktop ≥1024px):
  - 240px fixed left; full height below topbar; `var(--ovr-bg-elevated)` bg; 1px right border
  - Projects section: fetches all projects; list of project names with amber filled Badge when `changedCount > 0`; active project: amber left border + `var(--ovr-fg-primary)` text
  - Below each project: mini run-status row (last 5 runs as 8×8 colored dots using DiffStrip colors)
  - Bottom: `Separator` + version + "self-hosted" caption text

- [ ] 1.6 Create `apps/web/components/chrome/TabletSidebar.tsx` (RSC, 768–1023px):
  - 48px wide; 2-letter project monogram squares (`var(--ovr-accent-primary)` bg, white text)
  - Amber 6px dot in top-right corner of monogram when project has `changedCount > 0`
  - Each monogram links to project runs page

- [ ] 1.7 Create `apps/web/components/chrome/MobileChrome.tsx` (`"use client"`):
  - `MobileTopBar`: 48px; `Menu` icon left opens drawer; OvrMark + "ovr" center; avatar right
  - `MobileDrawer`: 280px left overlay; closes on backdrop click or nav link click; project list + separator + "settings" + "sign out"
  - `MobileTabBar`: 56px fixed bottom; 3 items: Projects (`FolderIcon`) · Runs (`PlayIcon`) · Settings (`SettingsIcon`); active: amber icon + amber 2px top border
