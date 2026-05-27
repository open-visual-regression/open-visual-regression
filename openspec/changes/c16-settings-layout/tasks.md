# 16 · Settings layout

Gate: `/settings` renders two-column layout with sub-nav rail; active link highlighted; admin-only sections hidden from `user` role.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (SettingsLayout)

## Component tree

```
apps/web/lib/components/
  settings-nav/
    SettingsNav.tsx           — 200px fixed rail, not scrollable
    SettingsNavSection.tsx    — section heading (personal / admin)
    SettingsNavLink.tsx       — active: 2px amber left border + amber text
```

## Tasks

- [ ] 1.1 Create `apps/web/app/(authenticated)/settings/layout.tsx`:
  - Two-column flex: `SettingsNav` (200px, fixed, not scrollable) + `flex-1` scrollable content
  - Pass session role to `SettingsNav`; admin-only section hidden from `user` role

- [ ] 1.2 Build `SettingsNav` in `apps/web/lib/components/settings-nav/`:
  - `SettingsNavSection` — section heading in `label` variant; padding top 16px
  - `SettingsNavLink` — active: 2px solid amber left border + amber text; inactive: `--ovr-fg-secondary`; lowercase; `caption` font size
  - Personal section: "profile" · "api keys" · "sessions"
  - Admin section (only if `session.user.role === "admin"`): "users" · "invitations" · "instance"
  - Rail: `var(--ovr-bg-elevated)` bg; 1px right border

- [ ] 1.3 Component test: admin user sees all sections; non-admin user does not see admin section heading or links
