---
title: No Redundant Workflow Repetition
impact: MEDIUM
tags: coverage, redundant, e2e, confidence
---

## No Redundant Workflow Repetition

Running the same interaction sequence across multiple tests adds test execution time without adding confidence. The second time a workflow passes, you've learned nothing new.

Before adding a test, ask: *Is any part of this interaction sequence already verified by another test?* If yes, start from the state after that sequence, not from scratch.

**Incorrect (same setup repeated across tests):**

```typescript
async function registerAndLogin() {
  render(<App />)
  await userEvent.click(screen.getByRole('link', { name: /register/i }))
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
  await userEvent.click(screen.getByRole('button', { name: /register/i }))
  // ... now we're logged in
}

it('shows dashboard after login', async () => { await registerAndLogin(); ... })
it('can update profile', async () => { await registerAndLogin(); ... })
it('can create a project', async () => { await registerAndLogin(); ... })
// Registration/login tested 3 times, zero new confidence each repeat
```

**Correct (test registration once, use factory for authenticated state):**

```typescript
it('user can register and is redirected to dashboard', async () => {
  // Tests the registration → login flow exactly once
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('link', { name: /register/i }))
  // ...
})

// Other tests start already authenticated
it('can update profile', async () => {
  renderAuthenticated(<App />) // uses a test utility that skips auth UI
  // ...
})
```

Reference: [Common Testing Mistakes](https://kentcdodds.com/blog/common-testing-mistakes)
