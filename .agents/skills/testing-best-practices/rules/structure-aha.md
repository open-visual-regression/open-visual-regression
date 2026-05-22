---
title: AHA — Abstract After Three Repetitions
impact: MEDIUM
tags: structure, aha, abstraction, dry
---

## AHA — Abstract After Third Repetition

AHA: Avoid Hasty Abstractions. In tests, premature abstraction creates helpers that obscure what's being tested. Duplication is fine until you see the same pattern three times — by then, the true shape of the abstraction is clear.

> "Prefer duplication over the wrong abstraction. Optimize for change first."

**Incorrect (premature abstraction, forces tests into a mold):**

```typescript
// Too early — the helper is shaped for one test, not a real pattern
function renderWithUser(overrides = {}) {
  return render(<UserCard user={{ name: 'Alice', role: 'admin', ...overrides }} />)
}

it('shows admin badge', () => {
  renderWithUser() // Hides what the test actually cares about
})
```

**Correct (inline first, abstract when pattern is clear):**

```typescript
// First test — inline everything
it('shows admin badge', () => {
  render(<UserCard user={{ name: 'Alice', role: 'admin', email: 'a@b.com' }} />)
  expect(screen.getByText('Admin')).toBeInTheDocument()
})

// Second test — duplicate, that's fine
it('shows user badge for non-admins', () => {
  render(<UserCard user={{ name: 'Bob', role: 'user', email: 'b@b.com' }} />)
  expect(screen.queryByText('Admin')).not.toBeInTheDocument()
})

// Third+ tests — now the abstraction's shape is clear
function renderUserCard(overrides: Partial<User> = {}) {
  const user = { name: 'Alice', role: 'user', email: 'a@b.com', ...overrides }
  return render(<UserCard user={user} />)
}
```

Reference: [AHA Programming](https://kentcdodds.com/blog/aha-programming), [Avoid Nesting When You're Testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing)
