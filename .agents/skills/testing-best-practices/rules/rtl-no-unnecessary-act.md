---
title: Don't Wrap in act() Manually
impact: HIGH
tags: rtl, act, warnings, antipattern
---

## Don't Wrap in act() Manually

`render`, `fireEvent`, and `userEvent` calls are already wrapped in `act()` by Testing Library. Wrapping them again is redundant and suppresses legitimate warnings.

**act() warnings are signal, not noise.** When you see an `act()` warning, it means state is updating outside of Testing Library's control — fix the root cause, don't suppress it.

**Incorrect (unnecessary act wrappers):**

```typescript
act(() => {
  render(<Counter />)
})

act(() => {
  fireEvent.click(screen.getByRole('button'))
})

// Suppressing the warning instead of fixing it
await act(async () => {
  // wrapping just to silence act() warnings
})
```

**Correct (let Testing Library handle act):**

```typescript
const user = userEvent.setup()
render(<Counter />)
await user.click(screen.getByRole('button'))
expect(screen.getByText('Count: 1')).toBeInTheDocument()
```

**When act() IS needed:**
- Wrapping your own custom hooks with `renderHook` + triggering updates
- Advancing fake timers: `act(() => vi.runAllTimers())`
- Direct calls to state setters outside of user events

If you get an `act()` warning after removing wrappers, investigate: something is updating state asynchronously after your test ends. Fix that instead of wrapping.

Reference: [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
