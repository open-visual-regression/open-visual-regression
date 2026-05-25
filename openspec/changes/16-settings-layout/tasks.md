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
  - Two-column flex: `SettingsNav` (200px) + `flex-1` scrollable content
  - Pass session role to `SettingsNav`; admin-only section hidden from `user` role

- [ ] 1.2 Build `SettingsNav` in `apps/web/lib/components/settings-nav/`:
  - `SettingsNavSection` — section heading label
  - `SettingsNavLink` — nav link with active state
  - Personal section: "profile" · "api keys" · "sessions"
  - Admin section (admin role only): "users" · "invitations" · "instance"

- [ ] 1.3 Create placeholder pages so navigation works:
  - `app/(authenticated)/settings/profile/page.tsx`
  - `app/(authenticated)/settings/sessions/page.tsx`
  - `app/(authenticated)/settings/instance/page.tsx` (admin only)

- [ ] 1.4 Component test: admin user sees all sections; non-admin does not see admin section
