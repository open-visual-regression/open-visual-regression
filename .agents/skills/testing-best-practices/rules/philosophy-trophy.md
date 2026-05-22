---
title: Testing Trophy — Mostly Integration
impact: CRITICAL
tags: philosophy, strategy, integration, trophy
---

## Testing Trophy — Mostly Integration

The testing trophy replaces the old pyramid. From bottom (foundation) to top (expensive):

1. **Static** — TypeScript, ESLint. Catches typos, type errors. Zero runtime cost.
2. **Unit** — Pure functions, utilities. Fast but low confidence on its own.
3. **Integration** — Multiple units working together. Best ROI.
4. **E2E** — Full browser automation. High confidence, high cost.

Invest primarily in integration tests. They test real interactions between units, survive refactors, and catch the bugs that matter.

> "Write tests. Not too many. Mostly integration." — Kent C. Dodds

**Incorrect (unit-heavy, no integration):**

```typescript
// Testing every internal function in isolation with mocks everywhere
it('calls formatDate with the correct argument', () => {
  const spy = vi.spyOn(utils, 'formatDate')
  renderComponent()
  expect(spy).toHaveBeenCalledWith(mockDate)
})
```

**Correct (integration-focused, real behavior):**

```typescript
// Test what the user actually sees
it('displays the formatted date', async () => {
  render(<EventCard date={new Date('2026-01-15')} />)
  expect(screen.getByText('January 15, 2026')).toBeInTheDocument()
})
```

Reference: [The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
