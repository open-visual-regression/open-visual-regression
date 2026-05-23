# OVR — Open Visual Regression

A self-hosted, open source tool for catching visual regressions.

OVR runs against your app on every PR (or local commit), snapshots the screens you tell it to, and compares them pixel-by-pixel to an approved baseline. When something changes, you get a side-by-side diff with the changed pixels painted amber — and a one-click approve / reject workflow that gates the merge.

It's not a SaaS. There is no pricing page. You `docker compose up` it, point it at your CI, and own the box.

---

## Product surfaces

This design system covers one core surface:

- **Web app dashboard** — the operator UI: projects → runs → run detail → diff viewer. Most of the daily-use lives here.

A CLI exists but is not in scope for this design system; its terminal output borrows directly from these visual rules (mono type, status glyphs, hairline rules).

## Source materials

The user requested this be designed **from scratch** — no codebase, no Figma, no existing brand. Everything in here is a fresh proposal. There are no upstream links to keep in sync.

## Visual direction in one sentence

Dark-first, mono-forward, hairline-dense — a terminal you can click through. The brand accent is **amber accent** (`#DDA13A`), a direct nod to the color visual-regression tools have always used to paint changed pixels.

---

## Index

Root files:

- `README.md` — this file
- `SKILL.md` — Claude Code / Agent Skills entry point
- `colors_and_type.css` — design tokens (colors, type, spacing, radii, shadows) as CSS custom properties
- `fonts/` — webfont files (JetBrains Mono — substitute for Berkeley Mono, flagged below)
- `assets/` — logos, brand marks, motif graphics
- `preview/` — small specimen HTML files that populate the Design System tab
- `ui_kits/dashboard/` — high-fidelity click-thru recreation of the web app

## ⚠️ Substitutions to confirm

- **Berkeley Mono** (requested) is paid. I substituted **JetBrains Mono** as the closest free analog — same operator feel, slightly less tight. If you have a Berkeley Mono license, drop the `.woff2` into `fonts/` and update `--font-mono` in `colors_and_type.css`.
- **Icons** use **Lucide** from CDN (thin stroke, terminal-friendly geometry). Swap for your own SVG set later if needed.

---

## CONTENT FUNDAMENTALS

OVR copy reads like a competent CLI talking to a competent engineer. No hand-holding, no exclamation marks, no emoji.

### Voice

- **Terse.** Five words where ten would do. "12 snapshots, 3 changed." not "We found 3 changes across 12 snapshots."
- **Lowercase by default.** Headings, button labels, nav items — all lowercase unless they're proper nouns or a status state (`PASS`, `FAIL`, `PENDING` are uppercase because they're literal CLI states).
- **Mechanical, not friendly.** No "let's", no "we", no "your". The system reports; it does not chat.
- **Active verbs over states.** "approve" not "approved by you", "rerun" not "re-running tests".
- **Numbers are data, never spelled.** "3 changed" not "three changed". Include units inline: `2.4s`, `1280×800`, `Δ0.12%`.

### Casing

| Where | Casing | Example |
|---|---|---|
| Page titles | lowercase | `runs` |
| Nav items | lowercase | `projects`, `settings` |
| Buttons | lowercase | `approve`, `reject`, `rerun` |
| Status badges | UPPERCASE | `PASS`, `FAIL`, `PENDING`, `STALE` |
| Code/keys/ids | kebab-case mono | `checkout-flow`, `pr-1284` |
| Proper nouns | Title Case | `GitHub`, `Chromium`, `Docker` |
| Section labels (small caps style) | UPPERCASE | `SNAPSHOTS`, `DIFFS`, `BASELINE` |

### Pronouns

- The product never says "you". It says nothing — it just reports.
- Docs and onboarding can use "you" sparingly, but never "we" or "I". OVR is a tool, not a person.

### Punctuation & symbols

- **No emoji.** Ever.
- Status glyphs are unicode geometry: `●` `○` `◐` `▲` `△` `✓` `✗` `Δ` — used as bullets and status markers, never decoratively.
- Em-dash for breaks. No oxford comma. No trailing periods on UI labels (only in full sentences).
- Counts in parentheses follow the noun: `runs (47)`, `failed (3)`.

### Example copy

```
runs                                              (47)
─────────────────────────────────────────────────────
● #1284  checkout-flow      3 changed   2m ago
○ #1283  checkout-flow      pass         12m ago
● #1282  marketing          1 changed    1h ago
○ #1281  checkout-flow      pass         3h ago
```

Empty states are blunt:

> `no runs yet. push a commit to start.`

Errors are factual, no apology:

> `baseline mismatch. expected 1280×800, got 1280×720.`

---

## VISUAL FOUNDATIONS

### Color

Dark-first. The base is a near-black with a faint cool tint (cooler than pure `#000` to read as "console" not "void"). One brand accent: **amber accent**, used sparingly — only for the brand mark, primary CTAs, and the "changed pixels" overlay in diffs. The system also exposes diff semantics (`add` green, `remove` red, `change` amber) and status semantics (`pass`, `fail`, `pending`, `stale`).

A light theme exists for printable reports and embed contexts. It is not the primary surface.

See `colors_and_type.css` for tokens. See `preview/colors-*.html` for specimens.

### Typography

**Mono everywhere** — display, body, code. JetBrains Mono (Berkeley Mono substitute). No serif. No second sans. The hierarchy is built from **weight + size + tracking**, not from a second family.

- Display sizes use `font-weight: 500` with `letter-spacing: -0.02em`.
- Body uses `font-weight: 400`.
- Labels and status badges use `font-weight: 600`, UPPERCASE, with `letter-spacing: 0.08em`.

### Spacing

A 4px base scale: `4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96`. Density is high — typical row padding is 8–12px vertical, not 16–20.

### Radii

Sharp. The radius scale is `0, 2, 4, 6` — that's it. Cards are `4px`. Buttons are `2px`. Pills (status badges) are `2px`, not fully rounded — they're *brackets*, not capsules.

### Backgrounds

- **No gradients.** Solid surfaces only, layered by elevation.
- **Pixel-grid texture.** A 16×16px dotted grid at 6% opacity lives on the empty/canvas backdrop of the diff viewer. This is the one decorative element.
- **No imagery.** No stock photos, no illustrations, no hand-drawn anything. The product is its own imagery.

### Borders

- **Hairline 1px borders** are the primary structural device. Borders separate; padding does not.
- Borders use `--border-subtle` (low contrast) for table rules and `--border-default` for card edges.
- Dashed borders (1px dashed) for "drop here" / "empty" states.

### Shadows

Shadows are nearly absent. The dark theme uses one elevation shadow for popovers/menus only:

- `--shadow-popover: 0 8px 24px -8px rgba(0,0,0,0.6), 0 0 0 1px var(--border-default)`

Cards do not float. They sit. The border is the elevation.

### Animation

- **Fast and linear.** 120ms `cubic-bezier(0.2, 0, 0, 1)` for hover/press, 200ms for view transitions.
- **No bounces. No springs.** This is a tool, not a toy.
- **Cursor blink** on focused inputs (steady-state, not just on focus).
- **Crossfade** between baseline ↔ current in the diff viewer (200ms linear).
- **No skeleton shimmer.** Loading states are a `●` glyph pulsing 60% → 100% opacity, or literal text: `loading…`.

### Hover states

- **Buttons:** background lightens by ~6% (dark theme). No scale, no shadow.
- **Rows:** background `--bg-hover` (4-5% lighter than base). Cursor → pointer.
- **Links:** `text-decoration: underline` appears on hover. Underline is 1px solid, 2px offset.

### Press states

- **Buttons:** background lightens by ~10% (one notch beyond hover). No shrink, no scale.
- **Rows:** no special press treatment — the click navigates.

### Focus

- **2px outline** in `--accent-primary`, `outline-offset: 2px`. Outline is never removed.
- Keyboard focus is treated as a first-class state, not an afterthought.

### Transparency & blur

- **Transparency:** used only for the pixel-grid overlay (13%) and for the diff-amber overlay on changed pixels (40%).
- **Blur:** none. No frosted glass, no backdrop filters.

### Layout rules

- **Fixed top bar** (48px) with project switcher + global nav.
- **Fixed left sidebar** (240px) for run list / file tree on detail screens.
- Main content scrolls. Top bar and sidebar do not.
- Max content width: none. The app fills the viewport. Density is the point.

### Cards

- 1px solid `--border-default` border
- 4px radius
- No shadow
- 16–20px padding
- Background `--bg-elevated` (one notch brighter than base)
- Sections within a card separated by 1px hairline, not by extra padding

### Visual motifs

- **Hairline rules** everywhere — structural, not decorative
- **Pixel-grid dotted overlay** on the diff canvas
- **Diff strip:** a 3px vertical bar in `add green / change amber / remove red` used as a status indicator on run rows
- **Bracketed labels:** `[PASS]`, `[FAIL]`, `[3 changed]` — never pill-shaped
- **Monospace numerals** (tabular figures on) so columns of numbers line up

---

## ICONOGRAPHY

OVR uses **Lucide** icons (loaded from CDN at `https://unpkg.com/lucide-static`). Lucide's geometry — 1.5px stroke, 24px grid, square caps, square joins — matches the terminal-coded brand. No icon system is embedded in the codebase yet; Lucide is the canonical choice.

### Rules

- **Stroke icons only.** Never filled. 1.5px stroke at 16px or 20px size.
- **Color follows text color.** Icons inherit `currentColor`. No multicolor icons.
- **No emoji.** Anywhere. If a state needs a glyph, use a unicode geometry character (`●`, `○`, `◐`, `▲`, `△`, `Δ`, `✓`, `✗`).
- **Status glyphs are first-class typography**, not icons. They live inline with text at the same line-height — they are characters, not graphics.
- **Logo / brand mark** is the one custom SVG. See `assets/ovr-mark.svg` and `assets/ovr-logo.svg`.

### Common icons in use

- `git-branch`, `git-commit`, `git-pull-request` — VCS context
- `play`, `square` (stop), `rotate-ccw` (rerun) — run actions
- `check`, `x`, `circle`, `circle-dot` — status
- `arrow-left-right`, `columns-2` — diff view modes
- `eye`, `eye-off` — show/hide diff overlay
- `settings`, `search`, `filter`, `chevron-down` — common UI

### Status glyphs (unicode, not icons)

| Glyph | Meaning | When |
|---|---|---|
| `●` | active / changed | run has unresolved diffs |
| `○` | idle / passed | run completed cleanly |
| `◐` | pending | run in progress |
| `△` | warning / stale | baseline older than 30 days |
| `✓` | approved | a specific diff was accepted |
| `✗` | rejected | a specific diff was rejected |
| `Δ` | delta | precedes any "% changed" number |
