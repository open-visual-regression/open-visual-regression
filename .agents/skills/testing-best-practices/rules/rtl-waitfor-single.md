---
title: waitFor — Single Assertion, No Side Effects
impact: HIGH
tags: rtl, waitfor, async, assertions
---

## waitFor — Single Assertion, No Side Effects

`waitFor` retries its callback until it stops throwing or times out. Two rules:

1. **One assertion per `waitFor` callback** — multiple assertions delay the failure point; you don't know which assertion failed or how long it took
2. **No side effects inside `waitFor`** — the callback may execute multiple times; side effects (clicks, API calls, state mutations) execute multiple times too

**Incorrect (multiple assertions → delayed failure):**

```typescript
await waitFor(() => {
  expect(screen.getByText('Alice')).toBeInTheDocument()
  expect(screen.getByText('Bob')).toBeInTheDocument() // if this fails, first assertion ran many times
  expect(mockFn).toHaveBeenCalledTimes(1)
})
```

**Incorrect (side effect inside waitFor):**

```typescript
await waitFor(() => {
  fireEvent.click(screen.getByRole('button')) // fires multiple times!
  expect(screen.getByText('Submitted')).toBeInTheDocument()
})
```

**Correct (single assertion, side effects outside):**

```typescript
// Wait for async element with find* — no waitFor needed
expect(await screen.findByText('Alice')).toBeInTheDocument()
expect(screen.getByText('Bob')).toBeInTheDocument() // now sync

// When waitFor is necessary (e.g., mock spy assertions)
await waitFor(() => expect(mockFn).toHaveBeenCalledWith('expected-arg'))
```

Prefer `find*` queries over `waitFor(() => get*())` — they are cleaner and purpose-built for async element waiting.

Reference: [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
