# OVR — Dashboard UI Kit

Click-through recreation of the OVR web app.

Open `index.html` and use the top bar / sidebar to navigate. The flow is:

1. **Projects** — pick a project (`checkout-flow`, `marketing`, `dashboard`)
2. **Runs** — pick a run
3. **Run detail** — grid of snapshot cards; click a `changed` one
4. **Diff viewer** — compare baseline ↔ current, approve / reject

This is a **visual + interaction recreation**, not real production code. Data is mocked.

## Files

- `index.html` — entry, loads everything in order
- `components.jsx` — primitives: `Button`, `Badge`, `Glyph`, `Icon`, `KeyHint`, `Field`, `DiffStrip`
- `chrome.jsx` — `TopBar`, `Sidebar`
- `mock-screens.jsx` — `MockCheckoutPage`, `MockEmptyCart`, `MockConfirmation` — the fake "system under test" UIs that the diff viewer compares
- `screens.jsx` — `ProjectsScreen`, `RunsScreen`, `RunDetailScreen`, `DiffScreen`
- `data.jsx` — mock projects, runs, snapshots
- `app.jsx` — top-level `App`, route state, mounts to `#root`

## Components in this kit

| Component | What it does |
|---|---|
| `Button` | primary / secondary / ghost / destructive · sm / md / lg |
| `Badge` | bracketed status indicator (`PASS`, `FAIL`, etc) |
| `Glyph` | unicode status character with semantic color |
| `Icon` | inline Lucide SVG, currentColor |
| `KeyHint` | keyboard shortcut chip (`⌘K`, `J`) |
| `Field` | labeled input |
| `DiffStrip` | 3px left-edge indicator on rows |
| `TopBar` | fixed 48px chrome — logo, breadcrumb, search, keys, settings |
| `Sidebar` | fixed 240px nav — projects, recent runs |
| `RunRow` | core list primitive (used in `RunsScreen`) |
| `SnapshotCard` | thumbnail card (used in `RunDetailScreen`) |
| `DiffViewer` | the core comparison UI — side-by-side / overlay / onion modes |

## Design fidelity notes

- All visuals derive from `colors_and_type.css` tokens at the project root. No hardcoded hex.
- Mock "system under test" pages use ordinary web colors (white, blue, black) — those are *not* OVR brand. OVR is the chrome around them.
- Diff regions are hand-placed magenta rectangles, not computed. This is a mock — the real backend computes them via per-pixel comparison.
