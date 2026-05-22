---
title: Never Test Implementation Details
impact: CRITICAL
tags: user-perspective, implementation-details, refactoring
---

## Never Test Implementation Details

Implementation details are things users of your code never see: internal state names, private methods, component instance methods, hook internals.

Testing them causes:
- **False negatives**: Tests break when you refactor, even though behavior is unchanged
- **False positives**: Tests pass even when the app is broken (testing the wrong thing)

> "Implementation details are things which users of your code will not typically use, see, or even know about."

**Incorrect (tests internal state directly):**

```typescript
// Enzyme-style — accessing component internals
it('sets isOpen to true when button clicked', () => {
  const wrapper = mount(<Accordion />)
  wrapper.find('button').simulate('click')
  expect(wrapper.state('isOpen')).toBe(true) // breaks if you rename state
})
```

**Correct (tests what users experience):**

```typescript
it('reveals content when button clicked', async () => {
  const user = userEvent.setup()
  render(<Accordion title="FAQ" content="Answer here" />)
  expect(screen.queryByText('Answer here')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'FAQ' }))
  expect(screen.getByText('Answer here')).toBeInTheDocument()
})
```

Rename `isOpen` to `expanded`, move to `useReducer`, extract to a hook — the test above never breaks.

Reference: [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
