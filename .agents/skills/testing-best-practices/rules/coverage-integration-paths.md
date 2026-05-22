---
title: Cover Critical Business Paths, Not Lines
impact: MEDIUM
tags: coverage, strategy, business-paths
---

## Cover Critical Business Paths, Not Lines

Coverage metrics measure execution, not correctness. A line that runs doesn't mean it works correctly. Use coverage reports as a **diagnostic tool** to find untested critical paths — not as a target to maximize.

Ask: *What are the paths through this code that matter most to users?* Cover those. Ignore lines that are defensive guards for impossible states.

**Using coverage as a gap finder (correct mental model):**

```bash
# Run with coverage
vitest run --coverage

# Review lcov report for red lines in critical flows:
# - Authentication flows
# - Payment/checkout paths
# - Data mutation operations
# - Error states users will encounter
```

**Incorrect (writing tests to hit red lines):**

```typescript
// Found this uncovered in coverage report
// But it's an impossible defensive check — this branch can never execute
it('handles null when null is impossible', () => {
  expect(formatUser(null as any)).toBe('') // meaningless, adds noise
})
```

**Correct (coverage reveals a real gap):**

```typescript
// Coverage showed the error state in UserProfile was never hit
it('shows error UI when profile fetch fails', async () => {
  server.use(http.get('/api/profile', () => HttpResponse.error()))
  render(<UserProfile userId="1" />)
  expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load/i)
})
```

Reference: [Common Testing Mistakes](https://kentcdodds.com/blog/common-testing-mistakes)
