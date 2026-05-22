---
title: Name Render Result 'view' Not 'wrapper'
impact: MEDIUM
tags: rtl, naming, conventions
---

## Name Render Result 'view' Not 'wrapper'

`wrapper` is Enzyme vocabulary. It implies a shallow component wrapper with direct access to component internals. Using it in Testing Library tests carries the wrong mental model and implies you're working around the library's design.

If you need to use the render result (for `rerender`, `unmount`, or `container`), name it `view`.

**Incorrect:**

```typescript
const wrapper = render(<MyComponent />)
wrapper.getByText('Hello') // Should use screen instead
```

**Correct:**

```typescript
// Most of the time: just call render, use screen
render(<MyComponent />)
screen.getByText('Hello')

// When you need the result:
const view = render(<MyComponent initialCount={0} />)
view.rerender(<MyComponent initialCount={5} />)
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

Reference: [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
