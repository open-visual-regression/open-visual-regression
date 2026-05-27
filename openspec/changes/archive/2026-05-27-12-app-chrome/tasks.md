# 12 · App shell + layout groups

Gate: authenticated routes show NavigationBar + correct sidebar at all three breakpoints; unauthenticated routes show minimal centered layout; unauthenticated visit to a protected route redirects to /login.

## Routing structure

Parallel route slots (`@navigation`, `@sidebar`) allow server-side data fetching per slot while keeping them mounted across navigations within the layout group.

```
proxy.ts                        Node.js proxy — route gating (task 11)
app/
  layout.tsx
  (unauthenticated)/
    layout.tsx                  centered full-height wrapper, no app shell
    login/
      page.tsx
    setup/
      page.tsx
    invite/[invitationId]/
      page.tsx
  (authenticated)/
    layout.tsx                  session guard → redirect /login
    @navigation/
      default.tsx               RSC — fetches session data → renders NavigationBar
    @sidebar/
      default.tsx               RSC — fetches projects + recent runs → renders Sidebar / SidebarCollapsed
    dashboard/
      page.tsx
```

## Component tree

```
apps/web/lib/components/
  navigation-bar/
    NavigationBar.tsx
    NavigationBarLogo.tsx
    NavigationBarSeparator.tsx
    NavigationBarBreadcrumb.tsx
    NavigationBarSearch.tsx     — ⌘K trigger; icon-only on tablet
    NavigationBarActions.tsx    — branch button + settings button + UserAvatar
    UserAvatar.tsx              — monogram square, opens sign-out DropdownMenu

  sidebar/
    Sidebar.tsx                 — desktop (240px)
    SidebarSection.tsx          — label row + optional count
    SidebarItem.tsx             — icon + label + change indicator
    SidebarFooter.tsx           — collapse toggle + version + "self-hosted"
    SidebarCollapsed.tsx        — tablet (48px)
    SidebarMonogram.tsx         — 2-letter monogram + amber dot when changedCount > 0

  mobile-app-shell/
    MobileNavBar.tsx            — 48px bar: hamburger + title + trailing slot
    MobileDrawer.tsx            — 280px left overlay
    MobileNavItem.tsx           — icon + label row
    MobileTabBar.tsx            — 56px fixed bottom
    MobileTabBarItem.tsx
```

## Tasks

- [x] 1.1 Update `apps/web/app/layout.tsx`: JetBrains Mono font, ThemeProvider, import `@ovr/ui/globals.css`

- [x] 1.2 Create `apps/web/app/(unauthenticated)/layout.tsx`: centered full-height wrapper, no app shell

- [x] 1.3 Update `apps/web/app/(authenticated)/layout.tsx`: session guard + responsive content insets

- [x] 1.4 Build `NavigationBar` in `apps/web/lib/components/navigation-bar/`; `@navigation/default.tsx` fetches session data and passes props

- [x] 1.5 Build `Sidebar` + `SidebarCollapsed` in `apps/web/lib/components/sidebar/`; `@sidebar/default.tsx` fetches projects + recent runs and renders correct variant

- [x] 1.6 Build `MobileAppShell` in `apps/web/lib/components/mobile-app-shell/` (`"use client"`)
