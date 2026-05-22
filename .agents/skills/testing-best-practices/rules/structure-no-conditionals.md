---
title: No Conditionals or Loops — Parameterize or Split
impact: MEDIUM
tags: structure, conditionals, loops, each, parameterize
---

## No Conditionals or Loops — Parameterize or Split

Tests must have a single, linear code path. `if` statements, ternaries, and loops inside tests make behavior conditional on runtime state — hiding which scenario is actually being exercised and making failures hard to diagnose.

**`if` / conditional logic:**
- Means one test is secretly two tests with one sometimes skipped
- Failing branch is invisible in the test name
- Passing branch can mask the other never running

**`for` / `forEach` loops:**
- One failure stops the rest from running
- Test name doesn't describe which iteration failed
- Use `it.each` / `describe.each` — each iteration becomes a named, independent test

---

**Incorrect (conditional logic hides branches):**

```typescript
it('displays the correct icon', () => {
  const statuses = ['active', 'inactive', 'pending']
  statuses.forEach((status) => {
    render(<StatusBadge status={status} />)
    if (status === 'active') {
      expect(screen.getByRole('img', { name: /active/i })).toBeInTheDocument()
    } else {
      expect(screen.getByRole('img', { name: /inactive/i })).toBeInTheDocument()
    }
    // Which branch ran? Which failed? Impossible to tell from the test name.
  })
})
```

**Incorrect (loop — one failure stops all, name tells nothing):**

```typescript
it('renders all items', () => {
  const items = ['Widget', 'Gadget', 'Doohickey']
  render(<ItemList items={items} />)
  items.forEach((name) => {
    expect(screen.getByText(name)).toBeInTheDocument()
  })
  // If 'Gadget' fails, 'Doohickey' never runs. Name says nothing about which item.
})
```

---

**Correct (split into separate tests — each scenario named):**

```typescript
it('displays the active icon for active status', () => {
  render(<StatusBadge status="active" />)
  expect(screen.getByRole('img', { name: /active/i })).toBeInTheDocument()
})

it('displays the inactive icon for inactive status', () => {
  render(<StatusBadge status="inactive" />)
  expect(screen.getByRole('img', { name: /inactive/i })).toBeInTheDocument()
})
```

**Correct (it.each — each iteration is an independent named test):**

```typescript
it.each([
  { status: 'active',   expectedLabel: /active/i   },
  { status: 'inactive', expectedLabel: /inactive/i  },
  { status: 'pending',  expectedLabel: /pending/i   },
])('displays the $expectedLabel icon for $status status', ({ status, expectedLabel }) => {
  render(<StatusBadge status={status} />)
  expect(screen.getByRole('img', { name: expectedLabel })).toBeInTheDocument()
})
```

**Correct (multiple assertions on one render are fine — no loop needed):**

```typescript
it('renders all items in the list', () => {
  render(<ItemList items={['Widget', 'Gadget', 'Doohickey']} />)
  expect(screen.getByText('Widget')).toBeInTheDocument()
  expect(screen.getByText('Gadget')).toBeInTheDocument()
  expect(screen.getByText('Doohickey')).toBeInTheDocument()
  // All three assertions run regardless; failure tells you exactly which item.
})
```

---

**When `it.each` vs split tests:**

- **`it.each`** — same behavior, different input/output data. Use when the test body is identical across cases.
- **Split tests** — meaningfully different scenarios that happen to share setup. Use when behavior differs, not just data.

Reference: [Avoid Nesting When You're Testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing)
