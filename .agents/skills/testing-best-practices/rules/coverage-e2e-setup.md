---
title: E2E — Test Critical Workflow Once, Use Programmatic Setup
impact: MEDIUM
tags: coverage, e2e, setup, programmatic
---

## E2E — Test Critical Workflow Once, Use Programmatic Setup

Running the same UI workflow (registration, login) in every E2E test provides zero additional confidence after the first passing run. It's pure overhead.

Test each critical UI workflow once. For subsequent tests that *require* that state (e.g., must be logged in), set up via HTTP/API/direct DB calls instead of clicking through the UI.

> "Test critical workflows once; reuse programmatic approaches for test data in all others."

**Incorrect (re-running login flow in every test):**

```typescript
// Each test does this: wastes time, no new confidence
test('can view dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'user@example.com')
  await page.fill('[name=password]', 'password')
  await page.click('button[type=submit]')
  await page.waitForURL('/dashboard')
  // Now actually test the dashboard...
})
```

**Correct (programmatic setup, UI test only for the workflow itself):**

```typescript
// One dedicated test exercises the login UI
test('user can log in via the login form', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'user@example.com')
  await page.fill('[name=password]', 'password')
  await page.click('[type=submit]')
  await expect(page).toHaveURL('/dashboard')
})

// All other tests: get auth token via API
test.beforeEach(async ({ page, request }) => {
  const { token } = await request.post('/api/auth/login', {
    data: { email: 'user@example.com', password: 'password' },
  }).then(r => r.json())
  await page.context().addCookies([{ name: 'auth', value: token, ... }])
})
```

Reference: [Common Testing Mistakes](https://kentcdodds.com/blog/common-testing-mistakes)
