# 01 · oxlint + oxfmt config

Gate: `pnpm lint` and `pnpm format -- --check` pass across all packages with zero violations.

- [x] 1.1 Install `oxlint` + `oxfmt` in root devDeps; wire `oxfmt` → `oxlint` into lint-staged pre-commit hook
- [x] 1.2 Add `"lint"` and `"format"` scripts to every package.json (`oxlint src` / `oxfmt src`); wire into turbo.json pipeline
- [x] 1.3 Create `oxlint.json` at repo root:
  ```json
  {
    "extends": ["oxlint:recommended"],
    "plugins": ["react", "typescript", "import", "unicorn"],
    "env": { "browser": true, "node": true },
    "rules": {}
  }
  ```
- [x] 1.4 Create `oxfmt.toml` at repo root:
  ```toml
  line_length = 100
  tailwind = true
  ```
- [x] 1.5 Run `pnpm lint` + `pnpm format -- --check` from root; fix all violations; both must pass clean
