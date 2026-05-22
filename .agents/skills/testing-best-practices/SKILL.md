---
name: testing-best-practices
description: Testing best practices for unit and integration tests using Vitest and Testing Library. Grounded in Kent C. Dodds' testing philosophy and Testing Library's guiding principles. Use when writing, reviewing, or refactoring tests to ensure confidence-driven, user-centric patterns.
license: MIT
metadata:
  author: tom
  version: "1.0.0"
---

# Testing Best Practices

Comprehensive testing guide grounded in Kent C. Dodds' philosophy and Testing Library's principles. Covers test strategy, structure, React Testing Library patterns, network mocking, and coverage mindset. Stack: Vitest + Testing Library.

> "The more your tests resemble the way your software is used, the more confidence they can give you."

## When to Apply

Reference these guidelines when:
- Writing new unit or integration tests
- Writing React component tests with Testing Library
- Reviewing tests for antipatterns
- Deciding what and how much to test
- Setting up network mocking for component tests
- Refactoring test structure and organization

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Test Philosophy | CRITICAL | `philosophy-` |
| 2 | User Perspective | CRITICAL | `user-` |
| 3 | Network Mocking | HIGH | `network-` |
| 4 | React Testing Library | HIGH | `rtl-` |
| 5 | Test Structure | MEDIUM | `structure-` |
| 6 | Coverage Strategy | MEDIUM | `coverage-` |

## Quick Reference

### 1. Test Philosophy (CRITICAL)

- `philosophy-trophy` — Mostly integration; static → unit → integration → e2e pyramid replaced by trophy
- `philosophy-confidence` — Every test action must increase confidence; delete tests that don't
- `philosophy-not-too-many` — No 100% coverage chase; ~70% sweet spot; diminishing returns after
- `philosophy-integration-focus` — Integration tests give best ROI: catch real bugs, survive refactors

### 2. User Perspective (CRITICAL)

- `user-no-impl-details` — Never test internal state, method names, or component instance props
- `user-no-test-user` — Only two users: end-user and developer-user; no third "test user"
- `user-behavior-not-internals` — Refactoring should not break tests if observable behavior unchanged

### 3. Network Mocking (HIGH)

- `network-msw` — Use MSW to intercept requests; never `vi.mock` fetch or axios directly
- `network-reuse-handlers` — Same MSW handlers in tests and dev; single source of truth

### 4. React Testing Library (HIGH)

- `rtl-query-priority` — Tier 1: `ByRole` > `ByLabelText` > `ByPlaceholderText` > `ByText` > `ByDisplayValue`; Tier 2: `ByAltText` > `ByTitle`; Tier 3: `ByTestId` (last resort); `getByRole` has options: `name`, `level`, `checked`, `selected`, `expanded`, `hidden`, `description`
- `rtl-screen` — Always use `screen.*`, never destructure from `render()`
- `rtl-user-event` — Use `@testing-library/user-event` over `fireEvent`
- `rtl-query-variants` — `get*` when element must exist; `query*` only for `.not.toBeInTheDocument()`; `find*` for async
- `rtl-no-unnecessary-act` — Don't wrap in `act()`; `render`/`fireEvent` already wrapped; warnings signal real bugs
- `rtl-waitfor-single` — One assertion per `waitFor` callback; no side-effects inside
- `rtl-no-wrapper-name` — Name render result `view` not `wrapper`; `wrapper` is Enzyme legacy

### 5. Test Structure (MEDIUM)

- `structure-no-nesting` — Flat `it()` blocks over deep `describe` nesting; nesting = mutable variable hell
- `structure-aha` — AHA over DRY: duplicate twice, abstract third time with confidence
- `structure-inline-setup` — Each test self-contained; call helper functions, not `beforeEach` for setup
- `structure-beforeeach-cleanup-only` — Reserve `beforeEach`/`afterEach` for mandatory cleanup (server teardown, spy restore)
- `structure-no-conditionals` — No `if`/ternaries/loops in tests; split into separate tests or use `it.each`/`describe.each`

### 6. Coverage Strategy (MEDIUM)

- `coverage-integration-paths` — Cover critical business paths; use coverage report to find gaps, not as target
- `coverage-e2e-setup` — E2E test critical workflow once; use HTTP/programmatic setup for test data in all others
- `coverage-no-redundant` — Don't repeat same workflow across tests; every extra run provides zero new confidence

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/philosophy-trophy.md
rules/rtl-query-priority.md
rules/network-msw.md
```

Each rule file contains:
- Why it matters
- Incorrect example with explanation
- Correct example
- Additional context

## Full Compiled Document

For complete guide with all rules expanded: `AGENTS.md`
