---
title: Correct Query Variants — get* vs query* vs find*
impact: HIGH
tags: rtl, queries, async, variants
---

## Correct Query Variants — get* vs query* vs find*

Three query variants serve distinct purposes. Using the wrong one produces misleading failures.

| Variant | Use when | Throws if missing? | Async? |
|---------|----------|-------------------|--------|
| `get*` | Element **must** exist right now | Yes | No |
| `query*` | Checking element **does not** exist | No | No |
| `find*` | Element will exist **after async work** | Yes (after timeout) | Yes |

**Incorrect (using query* to assert presence):**

```typescript
// query* returns null instead of throwing — test passes even if element never appears
const heading = screen.queryByRole('heading', { name: /welcome/i })
expect(heading).toBeInTheDocument()
// If heading never renders, `heading` is null and this silently passes
```

**Incorrect (using get* for async elements):**

```typescript
// get* throws immediately before the async operation completes
screen.getByText('Loaded data') // throws before fetch resolves
```

**Correct:**

```typescript
// Element must be there now → get*
expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled()

// Asserting absence → query*
expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

// Element appears after async work → find* (returns a promise)
expect(await screen.findByText('Alice')).toBeInTheDocument()
```

> "The *only* reason the `query*` variant exists is so you have a function you can call which does not throw." — Kent C. Dodds

Reference: [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
