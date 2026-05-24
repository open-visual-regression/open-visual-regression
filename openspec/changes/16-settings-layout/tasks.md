# 16 · Settings layout

Gate: `/settings` renders two-column layout with sub-nav rail; active link highlighted; admin-only sections hidden from `user` role.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (SettingsLayout)

- [ ] 1.1 Create `apps/web/app/(app)/settings/layout.tsx`:
  - Two-column flex: 200px left sub-nav rail (fixed, not scrollable) + `flex-1` scrollable content
  - Sub-nav rail: `var(--ovr-bg-elevated)` bg; 1px right border; padding top 16px
  - Nav sections:
    - Personal (section heading in `label` variant): "profile" · "api keys" · "sessions"
    - Admin (section heading, only rendered if `session.user.role === "admin"`): "users" · "invitations" · "instance"
  - Active link: 2px solid amber left border + amber text; inactive: `--ovr-fg-secondary`
  - Links are lowercase, `caption` font size
- [ ] 1.2 Create placeholder pages so navigation works:
  - `app/(app)/settings/profile/page.tsx` → "coming soon" placeholder
  - `app/(app)/settings/sessions/page.tsx` → "coming soon" placeholder
  - `app/(app)/settings/instance/page.tsx` → "coming soon" placeholder (admin only)
- [ ] 1.3 Component test: admin user sees all sections; non-admin user does not see admin section heading or links
