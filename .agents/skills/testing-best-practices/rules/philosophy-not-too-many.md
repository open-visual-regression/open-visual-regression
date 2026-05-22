---
title: Don't Chase 100% Coverage
impact: CRITICAL
tags: philosophy, coverage, strategy
---

## Don't Chase 100% Coverage

Coverage reports show *what ran*, not *what works*. Chasing 100% leads to:
- Trivial tests with no confidence value
- Testing implementation details to hit uncovered lines
- False security from a green badge

Sweet spot: ~70-80% on meaningful paths. Use coverage reports as a **gap finder**, not a success metric.

**What coverage can't tell you:**
- Code meets business requirements
- Components integrate correctly
- App won't enter bad states

**Incorrect (written to hit a line, not verify behavior):**

```typescript
// This test exists only to execute the error branch
it('handles the catch block', () => {
  // forces an unreachable error path just for coverage
  expect(() => internalHelper(null)).toThrow()
})
```

**Correct (covers critical paths, uses reports to find real gaps):**

```typescript
// Check coverage report → found the error state wasn't tested
it('shows an error message when the API fails', async () => {
  server.use(
    http.get('/api/data', () => HttpResponse.error())
  )
  render(<DataList />)
  expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
})
```

Reference: [Common Testing Mistakes](https://kentcdodds.com/blog/common-testing-mistakes)
