---
title: Reuse MSW Handlers Across Tests and Dev
impact: HIGH
tags: network, msw, handlers, dev-server
---

## Reuse MSW Handlers Across Tests and Dev

Define MSW handlers once and use them in both test setup and the development server. Single source of truth eliminates drift between mocked behavior in tests and mocked behavior during local development.

**Structure:**

```
src/
  mocks/
    handlers.ts     ← shared handlers
    browser.ts      ← dev server worker (for browser dev)
    server.ts       ← test server (for Vitest/Node)
```

**handlers.ts (shared):**

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () =>
    HttpResponse.json([
      { id: 1, name: 'Alice', email: 'alice@example.com' },
    ])
  ),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 2, ...body }, { status: 201 })
  }),
]
```

**server.ts (test setup):**

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

**vitest.setup.ts:**

```typescript
import { server } from './src/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

Use `onUnhandledRequest: 'error'` to catch forgotten handlers — unhandled requests fail loudly instead of silently returning nothing.

Reference: [Stop Mocking Fetch](https://kentcdodds.com/blog/stop-mocking-fetch)
