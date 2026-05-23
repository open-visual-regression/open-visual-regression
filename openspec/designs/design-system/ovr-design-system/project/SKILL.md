---
name: ovr-design
description: Use this skill to generate well-branded interfaces and assets for OVR (Open Visual Regression), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

OVR is a self-hosted, open-source visual-regression tool. The brand is dark-first, mono-forward, hairline-dense — a terminal you can click through. Diff magenta (`#FF3D8F`-ish, defined precisely in `colors_and_type.css` as `--accent-primary`) is the one brand accent, used sparingly. All other UI semantics (diff add/remove/change, status pass/fail/pending/stale) are defined as CSS custom properties in `colors_and_type.css`.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Link `colors_and_type.css` from the project root. Use the JSX components in `ui_kits/dashboard/` (`Button`, `Badge`, `Glyph`, `Icon`, `DiffStrip`, `TopBar`, `Sidebar`, etc.) as ready-made primitives — they expose themselves on `window` after load.

If working on production code, copy assets and read the rules here to become an expert in designing with this brand. The four documents that matter most:

1. **`README.md`** — the canonical voice, content, and visual rules. Read this first.
2. **`colors_and_type.css`** — the token contract. Never invent new colors or sizes; reach for these vars.
3. **`ui_kits/dashboard/`** — the components, faithfully implemented. Mirror them or copy them directly.
4. **`preview/`** — visual specimens. If you need to know what a button or a run-row actually looks like, open the matching file.

Hard rules:

- No emoji, anywhere. Use unicode status glyphs (`●` `○` `◐` `△` `Δ` `✓` `✗`) instead.
- Lowercase UI labels by default. Status badges are UPPERCASE (`PASS`, `FAIL`).
- Monospace everywhere — display, body, code. No second sans-serif.
- Sharp corners. Radius caps at 6px. Buttons/badges are 2px.
- Borders carry elevation. Cards have no shadow; only popovers and modals do.
- Lucide icons (1.5px stroke) only. Never filled icons. Never decorative SVG illustration.
- The accent magenta is reserved for: primary CTAs, brand mark, diff overlays. Not decoration.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need. Always confirm: which surface (dashboard, CLI mockup, marketing one-pager), what fidelity, and whether they want to stay strictly on-brand or push the system somewhere new.
