# 02 · Vitest workspace

Gate: `pnpm test` at repo root discovers and runs all test files; `apps/web` component tests work with testing-library.

- [ ] 1.1 Install `vitest` at repo root; create `vitest.workspace.ts` referencing every package that has a `vitest.config.ts`
- [ ] 1.2 Create/update `vitest.config.ts` in `apps/web`: `environment: "jsdom"`, `setupFiles: ["./vitest.setup.ts"]`; add `"test": "vitest run"` to apps/web package.json
- [ ] 1.3 Install `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` in `apps/web`; create `apps/web/vitest.setup.ts` that imports `@testing-library/jest-dom/vitest`
- [ ] 1.4 Create `vitest.config.ts` in `apps/worker`, `apps/cli`, `packages/services`, `packages/api`: `environment: "node"`; co-located unit tests as `*.test.ts`
- [ ] 1.5 Create `vitest.config.ts` in `packages/db`, `packages/queue`, `packages/storage`: `environment: "node"`; integration test glob `src/__tests__/integration/**/*.test.ts`; `testTimeout: 30000`
- [ ] 1.6 Wire `test` into `turbo.json` with `dependsOn: ["^build"]` and `outputs: ["coverage/**"]`
- [ ] 1.7 Write one smoke test per package (trivially passes: `expect(true).toBe(true)`); confirm `pnpm test` runs all of them
