---
title: Flat Tests Over Deep Nesting
impact: MEDIUM
tags: structure, nesting, describe, beforeEach
---

## Flat Tests Over Deep Nesting

Deep `describe` nesting with shared `beforeEach` blocks creates:
- Mutable variables scattered across multiple scope levels
- Mental overhead: you must read all nested scopes to understand one test
- Tests that can't stand alone — breaking a `beforeEach` breaks many tests silently

Keep tests flat. Each test should tell its complete story.

**Incorrect (deeply nested, mutable shared state):**

```typescript
describe('UserCard', () => {
  let user: User
  let wrapper: RenderResult

  beforeEach(() => {
    user = createUser()
  })

  describe('when authenticated', () => {
    beforeEach(() => {
      user.isAuthenticated = true // mutating shared state
      wrapper = render(<UserCard user={user} />)
    })

    describe('when premium', () => {
      beforeEach(() => {
        user.isPremium = true // mutating again — now three levels up
      })

      it('shows premium badge', () => {
        // What is `user` here? Must trace back through 3 beforeEach blocks
        expect(wrapper.getByText('Premium')).toBeInTheDocument()
      })
    })
  })
})
```

**Correct (flat, self-contained):**

```typescript
it('shows premium badge for authenticated premium users', () => {
  render(<UserCard user={{ isAuthenticated: true, isPremium: true, name: 'Alice' }} />)
  expect(screen.getByText('Premium')).toBeInTheDocument()
})

it('hides premium badge for free users', () => {
  render(<UserCard user={{ isAuthenticated: true, isPremium: false, name: 'Alice' }} />)
  expect(screen.queryByText('Premium')).not.toBeInTheDocument()
})
```

Use helper functions that return fresh values instead of `beforeEach` with mutable variables.

Reference: [Avoid Nesting When You're Testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing)
