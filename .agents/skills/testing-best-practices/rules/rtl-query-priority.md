---
title: Query Priority — Accessibility-First Order
impact: HIGH
tags: rtl, queries, accessibility, roles, aria
---

## Query Priority — Accessibility-First Order

Query elements the way users and assistive technology interact with them. Testing Library defines three tiers:

### Tier 1: Accessible to Everyone (visual + screen reader users)

**1. `ByRole`** — Always try first.  
Matches every element exposed in the accessibility tree. If you can't find an element with `getByRole`, your UI may have an accessibility problem. Use the `name` option to filter by accessible name.

```typescript
// Basic role
screen.getByRole('button')

// With accessible name (label, aria-label, or text content)
screen.getByRole('button', { name: /submit/i })

// Heading at specific level
screen.getByRole('heading', { level: 2 })

// Checked checkbox
screen.getByRole('checkbox', { checked: true })

// Selected tab
screen.getByRole('tab', { selected: true, name: /settings/i })

// Expanded disclosure
screen.getByRole('button', { expanded: true })

// Include elements hidden from accessibility tree
screen.getAllByRole('button', { hidden: true })

// Filter by accessible description
screen.getByRole('alertdialog', { description: /session is about to expire/i })
```

**2. `ByLabelText`** — Best for form fields.  
Mirrors how screen reader users navigate forms — by hearing the label.

```typescript
screen.getByLabelText(/email address/i)
screen.getByLabelText('Password')
```

**3. `ByPlaceholderText`** — Fallback for unlabeled inputs only.  
A placeholder is not a substitute for a label. Prefer `ByLabelText` and fix the accessibility issue.

**4. `ByText`** — For non-interactive elements.  
Outside forms, visible text is how users find content. Use for paragraphs, headings, list items.

```typescript
screen.getByText(/terms of service/i)
```

**5. `ByDisplayValue`** — For pre-filled form fields.  
Matches the current displayed value of inputs, selects, textareas.

### Tier 2: Semantic Queries (HTML/ARIA with variable AT support)

**6. `ByAltText`** — For images and elements with alt text.

**7. `ByTitle`** — Least reliable. Title attributes are not consistently read by screen readers and not visible to sighted users.

### Tier 3: Test IDs (Last Resort)

**8. `ByTestId`** — Only when no accessible query is feasible.  
Users cannot see or hear `data-testid` attributes. Use only for dynamic content where text/role matching isn't possible.

---

**Incorrect (test IDs as default):**

```typescript
const btn = screen.getByTestId('submit-button')
const input = screen.getByTestId('email-input')
const heading = screen.getByTestId('section-title')
```

**Correct (accessibility-first):**

```typescript
const btn = screen.getByRole('button', { name: /submit/i })
const input = screen.getByLabelText(/email address/i)
const heading = screen.getByRole('heading', { level: 2, name: /account settings/i })
```

If `getByRole` can't find your element, that's a signal your component is inaccessible — fix the component, don't reach for `getByTestId`.

Reference: [About Queries — Priority](https://testing-library.com/docs/queries/about/#priority), [ByRole](https://testing-library.com/docs/queries/byrole)
