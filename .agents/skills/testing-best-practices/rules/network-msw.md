---
title: Use MSW Instead of Mocking Fetch
impact: HIGH
tags: network, msw, mocking, fetch
---

## Use MSW Instead of Mocking Fetch

Never mock `fetch`, `axios`, or other HTTP clients directly with `vi.mock`. This:
- Re-implements backend response logic in every test
- Loses confidence in the actual client code (headers, auth, serialization)
- Leaks implementation details into tests
- Creates divergence between mocked behavior and real API behavior

Use **Mock Service Worker (MSW)** instead. MSW intercepts at the network level — your actual fetch code runs, only the network response is controlled.

**Incorrect (mocking fetch directly):**

```typescript
vi.mock('../api/client')

it('displays users', async () => {
  ;(apiClient.get as vi.Mock).mockResolvedValue({ data: [{ id: 1, name: 'Alice' }] })
  render(<UserList />)
  expect(await screen.findByText('Alice')).toBeInTheDocument()
  // Does your real fetch even have the right headers? Unknown.
})
```

**Correct (MSW intercepts at network level):**

```typescript
// handlers.ts (shared between tests and dev server)
export const handlers = [
  http.get('/api/users', () =>
    HttpResponse.json([{ id: 1, name: 'Alice' }])
  ),
]

// setup.ts
const server = setupServer(...handlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// component.test.ts
it('displays users', async () => {
  render(<UserList />)
  expect(await screen.findByText('Alice')).toBeInTheDocument()
  // Your real fetch code ran. Confidence: high.
})

// Override for error case in a specific test
it('shows error state', async () => {
  server.use(http.get('/api/users', () => HttpResponse.error()))
  render(<UserList />)
  expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
})
```

Reference: [Stop Mocking Fetch](https://kentcdodds.com/blog/stop-mocking-fetch)
