---
title: Always Use screen.*
impact: HIGH
tags: rtl, screen, queries
---

## Always Use screen.*

Import and use `screen` from `@testing-library/react` for all queries. Never destructure query methods from `render()`.

**Why:**
- `screen` is available anywhere in the test without passing variables around
- Better autocomplete — `screen.` surfaces all available queries
- Consistent pattern across your test suite
- Future-proof: `render` return API changes won't break your queries
- Name `wrapper` is Enzyme legacy and confuses intent

**Incorrect (destructuring from render):**

```typescript
const { getByText, getByRole, queryByTestId } = render(<MyComponent />)
// Confusing: does `getByText` belong to this render or some wrapper?
```

**Also incorrect (naming it wrapper):**

```typescript
const wrapper = render(<MyComponent />)
wrapper.getByText('Hello')
// "wrapper" implies Enzyme shallow rendering — wrong mental model
```

**Correct:**

```typescript
render(<MyComponent />)
screen.getByRole('heading', { name: /welcome/i })
screen.getByText('Hello')
await screen.findByRole('status')
```

If you need the `container` for special cases, name it `view`:

```typescript
const view = render(<MyComponent />)
// view.container, view.unmount(), view.rerender() — clear and intentional
```

Reference: [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
