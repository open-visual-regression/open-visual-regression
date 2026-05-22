---
title: Refactoring Must Not Break Tests
impact: CRITICAL
tags: user-perspective, refactoring, behavior
---

## Refactoring Must Not Break Tests

If refactoring breaks a test without changing observable behavior, the test is testing implementation details.

Good tests are **refactor-friendly**: rename state, extract hooks, swap libraries — tests still pass as long as users still see the same thing.

> "You should very rarely have to change tests when you refactor code."

**Signal that you're testing implementation details:**
- Test breaks when you rename a variable
- Test breaks when you move logic to a custom hook
- Test breaks when you swap `useState` for `useReducer`
- Test requires importing the component's internal modules

**Incorrect (coupled to internal structure):**

```typescript
import { calculateTotal } from '../utils/cart' // directly testing internal

it('calculateTotal sums line items', () => {
  expect(calculateTotal([{ price: 10, qty: 2 }])).toBe(20)
})
// If you inline this logic into the component, this test breaks
// even though cart still works perfectly
```

**Correct (testing through the public interface):**

```typescript
it('displays the correct order total', async () => {
  render(<CartSummary items={[{ name: 'Widget', price: 10, qty: 2 }]} />)
  expect(screen.getByText('Total: $20.00')).toBeInTheDocument()
})
// Refactor the calculation however you want — test stays green
```

Reference: [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
