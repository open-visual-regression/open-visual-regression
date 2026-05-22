---
title: Avoid the Test User
impact: CRITICAL
tags: user-perspective, test-user, antipattern
---

## Avoid the Test User

Two legitimate users exist for any component:
1. **End-user** — interacts with the rendered UI
2. **Developer-user** — passes props and renders the component

A "test user" is a third fake user who accesses internal state, calls private methods, and asserts on implementation details nobody else cares about.

> "Nobody cares about the testing user. The testing user doesn't pay the bills like the end user."

When you create a test user, you couple tests to internals. Refactoring internals → tests break, even when everything still works for real users.

**Incorrect (test user — accessing internal wiring):**

```typescript
it('calls onSubmit with form values', () => {
  const { result } = renderHook(() => useForm())
  act(() => result.current.setField('email', 'a@b.com'))
  act(() => result.current.handleSubmit())
  // This tests the hook's internal API, not user behavior
  expect(result.current.submitted).toBe(true)
})
```

**Correct (end-user perspective):**

```typescript
it('submits the form and shows a success message', async () => {
  const user = userEvent.setup()
  render(<SignupForm />)
  await user.type(screen.getByLabelText(/email/i), 'a@b.com')
  await user.click(screen.getByRole('button', { name: /sign up/i }))
  expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
})
```

Reference: [Avoid the Test User](https://kentcdodds.com/blog/avoid-the-test-user)
