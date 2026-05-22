---
title: Use userEvent Over fireEvent
impact: HIGH
tags: rtl, user-event, interactions, fire-event
---

## Use userEvent Over fireEvent

`@testing-library/user-event` simulates real user interactions more accurately than `fireEvent`. A real click triggers `pointerover`, `pointerenter`, `mouseover`, `mouseenter`, `pointermove`, `mousemove`, `pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`. `fireEvent.click` fires only `click`.

Use `userEvent` for all interactions that users can perform. Reserve `fireEvent` only for browser events that users can't directly trigger (e.g., `paste` with specific clipboardData).

**Incorrect (fireEvent misses intermediate events):**

```typescript
import { fireEvent } from '@testing-library/react'

fireEvent.click(screen.getByRole('button', { name: /submit/i }))
fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
// Does not trigger keyDown/keyUp/keyPress — misses handlers that listen to those
```

**Correct (userEvent simulates real interaction):**

```typescript
import userEvent from '@testing-library/user-event'

const user = userEvent.setup()

await user.click(screen.getByRole('button', { name: /submit/i }))
await user.type(screen.getByLabelText(/email/i), 'a@b.com')
await user.selectOptions(screen.getByRole('combobox'), 'Option A')
await user.keyboard('{Enter}')
```

Always call `userEvent.setup()` and use the returned `user` object — it maintains pointer state across interactions, matching real browser behavior.

Reference: [Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
