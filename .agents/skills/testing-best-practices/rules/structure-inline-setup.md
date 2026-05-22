---
title: Self-Contained Tests — Inline Setup
impact: MEDIUM
tags: structure, inline, setup, self-contained
---

## Self-Contained Tests — Inline Setup

Each test should be fully understandable without reading surrounding code. When setup is scattered across `beforeEach` blocks and outer `describe` scopes, a reader must mentally reconstruct state to understand any single test.

Use factory/builder helper functions called **inside** tests rather than `beforeEach` for state setup.

**Incorrect (setup scattered across scopes):**

```typescript
let server: SetupServer
let mockData: ResponseData

beforeAll(() => { server = setupServer(...handlers) })
beforeEach(() => { mockData = generateMockData() })
afterAll(() => server.close())

it('renders items', () => {
  // What is mockData here? What server state is active?
  // Must trace back through 3 blocks.
  render(<List data={mockData} />)
  expect(screen.getByText(mockData.items[0].name)).toBeInTheDocument()
})
```

**Correct (factory called inline, test tells its story):**

```typescript
// beforeAll/afterAll only for infrastructure that can't run per-test
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

it('renders items', () => {
  const data = buildResponseData({ items: [{ name: 'Widget' }] })
  render(<List data={data} />)
  expect(screen.getByText('Widget')).toBeInTheDocument()
})
```

**When `beforeEach` IS appropriate:**
- Starting/stopping servers or processes
- Restoring mocked globals (`vi.restoreAllMocks()`)
- Resetting MSW handlers (`server.resetHandlers()`)
- Spying on `console.error` to suppress expected noise

Reference: [Avoid Nesting When You're Testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing)
