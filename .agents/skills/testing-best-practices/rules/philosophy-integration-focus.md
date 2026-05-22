---
title: Integration Tests Give Best ROI
impact: CRITICAL
tags: philosophy, integration, roi, mocking
---

## Integration Tests Give Best ROI

Integration tests test multiple units working together with minimal mocking. They:
- Catch real bugs unit tests miss (wiring, data flow, state interactions)
- Survive refactors because they test behavior not implementation
- Don't require updating when internals change

Excessive mocking destroys integration confidence. Every mock is a gap in coverage.

> "The more you mock, the less confidence you get from your tests." — Kent C. Dodds

**Incorrect (heavy mocking, testing units in isolation):**

```typescript
vi.mock('../api/users')
vi.mock('../hooks/useAuth')
vi.mock('../utils/format')

it('renders the user card', () => {
  ;(useAuth as vi.Mock).mockReturnValue({ user: mockUser })
  ;(formatName as vi.Mock).mockReturnValue('John D.')
  render(<UserCard userId="1" />)
  expect(screen.getByText('John D.')).toBeInTheDocument()
  // Are you confident the real code works? No.
})
```

**Correct (real hooks, MSW for network, minimal mocking):**

```typescript
it('renders the user card with fetched data', async () => {
  render(<UserCard userId="1" />)
  expect(await screen.findByText('John Doe')).toBeInTheDocument()
  expect(screen.getByText('john@example.com')).toBeInTheDocument()
})
```

Reference: [Write Tests](https://kentcdodds.com/blog/write-tests)
