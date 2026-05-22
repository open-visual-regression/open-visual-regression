---
title: Every Test Must Increase Confidence
impact: CRITICAL
tags: philosophy, confidence, purpose
---

## Every Test Must Increase Confidence

Before writing or keeping any test, ask: *Does this increase my confidence that the app works for users?*

If no → delete it or don't write it.

Tests that only verify internal plumbing give false confidence. They pass when the app is broken and break when the app is fine.

**Incorrect (verifies mechanics, not behavior):**

```typescript
it('sets loading to true then false', () => {
  const { result } = renderHook(() => useDataFetcher())
  expect(result.current.loading).toBe(true)
  // This tells you nothing about whether users see a spinner
})
```

**Correct (verifies what users experience):**

```typescript
it('shows a loading spinner then renders data', async () => {
  render(<DataList />)
  expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  expect(await screen.findByText('Item 1')).toBeInTheDocument()
  expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument()
})
```

Reference: [Write Tests](https://kentcdodds.com/blog/write-tests)
