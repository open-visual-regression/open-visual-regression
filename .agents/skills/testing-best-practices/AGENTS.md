# Testing Best Practices

**Version 1.0.0**  
Stack: Vitest + Testing Library  
May 2026

> This document is for agents and LLMs to follow when writing, reviewing, or refactoring tests. Grounded in Kent C. Dodds' testing philosophy and Testing Library's guiding principles.

---

## Foundational Principle

> **"The more your tests resemble the way your software is used, the more confidence they can give you."** — Testing Library

Every rule below derives from this. When in doubt, ask: *Does this test action reflect how a real user or developer interacts with the software?*

---

## Table of Contents

1. [Test Philosophy](#1-test-philosophy) — **CRITICAL**
   - 1.1 [Testing Trophy — Mostly Integration](#11-testing-trophy--mostly-integration)
   - 1.2 [Every Test Must Increase Confidence](#12-every-test-must-increase-confidence)
   - 1.3 [Don't Chase 100% Coverage](#13-dont-chase-100-coverage)
   - 1.4 [Integration Tests Give Best ROI](#14-integration-tests-give-best-roi)
2. [User Perspective](#2-user-perspective) — **CRITICAL**
   - 2.1 [Never Test Implementation Details](#21-never-test-implementation-details)
   - 2.2 [Avoid the Test User](#22-avoid-the-test-user)
   - 2.3 [Refactoring Must Not Break Tests](#23-refactoring-must-not-break-tests)
3. [Network Mocking](#3-network-mocking) — **HIGH**
   - 3.1 [Use MSW Instead of Mocking Fetch](#31-use-msw-instead-of-mocking-fetch)
   - 3.2 [Reuse MSW Handlers Across Tests and Dev](#32-reuse-msw-handlers-across-tests-and-dev)
4. [React Testing Library](#4-react-testing-library) — **HIGH**
   - 4.1 [Query Priority — ByRole First](#41-query-priority--byrole-first)
   - 4.2 [Always Use screen.*](#42-always-use-screen)
   - 4.3 [Use userEvent Over fireEvent](#43-use-userevent-over-fireevent)
   - 4.4 [Correct Query Variants — get* vs query* vs find*](#44-correct-query-variants--get-vs-query-vs-find)
   - 4.5 [Don't Wrap in act() Manually](#45-dont-wrap-in-act-manually)
   - 4.6 [waitFor — Single Assertion, No Side Effects](#46-waitfor--single-assertion-no-side-effects)
   - 4.7 [Name Render Result 'view' Not 'wrapper'](#47-name-render-result-view-not-wrapper)
5. [Test Structure](#5-test-structure) — **MEDIUM**
   - 5.1 [Flat Tests Over Deep Nesting](#51-flat-tests-over-deep-nesting)
   - 5.2 [AHA — Abstract After Third Repetition](#52-aha--abstract-after-third-repetition)
   - 5.3 [No Conditionals or Loops — Parameterize or Split](#53-no-conditionals-or-loops--parameterize-or-split)
   - 5.4 [Self-Contained Tests — Inline Setup](#54-self-contained-tests--inline-setup)
6. [Coverage Strategy](#6-coverage-strategy) — **MEDIUM**
   - 6.1 [Cover Critical Business Paths, Not Lines](#61-cover-critical-business-paths-not-lines)
   - 6.2 [E2E — Test Critical Workflow Once, Use Programmatic Setup](#62-e2e--test-critical-workflow-once-use-programmatic-setup)
   - 6.3 [No Redundant Workflow Repetition](#63-no-redundant-workflow-repetition)

---

## 1. Test Philosophy

### 1.1 Testing Trophy — Mostly Integration

**Impact: CRITICAL**

The testing trophy replaces the old pyramid. From bottom (foundation) to top (expensive):

1. **Static** — TypeScript, ESLint. Catches typos, type errors. Zero runtime cost.
2. **Unit** — Pure functions, utilities. Fast but low confidence on its own.
3. **Integration** — Multiple units working together. Best ROI.
4. **E2E** — Full browser automation. High confidence, high cost.

Invest primarily in integration tests.

> "Write tests. Not too many. Mostly integration." — Kent C. Dodds

**Incorrect (unit-heavy, no integration):**
```typescript
it('calls formatDate with the correct argument', () => {
  const spy = vi.spyOn(utils, 'formatDate')
  renderComponent()
  expect(spy).toHaveBeenCalledWith(mockDate)
})
```

**Correct (integration-focused):**
```typescript
it('displays the formatted date', async () => {
  render(<EventCard date={new Date('2026-01-15')} />)
  expect(screen.getByText('January 15, 2026')).toBeInTheDocument()
})
```

---

### 1.2 Every Test Must Increase Confidence

**Impact: CRITICAL**

Before writing or keeping any test, ask: *Does this increase my confidence that the app works for users?* If no → delete it.

**Incorrect:**
```typescript
it('sets loading to true then false', () => {
  const { result } = renderHook(() => useDataFetcher())
  expect(result.current.loading).toBe(true)
})
```

**Correct:**
```typescript
it('shows a loading spinner then renders data', async () => {
  render(<DataList />)
  expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  expect(await screen.findByText('Item 1')).toBeInTheDocument()
  expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument()
})
```

---

### 1.3 Don't Chase 100% Coverage

**Impact: CRITICAL**

Coverage shows *what ran*, not *what works*. Sweet spot: ~70-80% on meaningful paths. Use coverage as a gap finder, not a target.

**What coverage can't tell you:**
- Code meets business requirements
- Components integrate correctly
- App won't enter bad states

Use `vitest run --coverage` to find untested critical paths, then write tests for those paths — not to hit a percentage.

---

### 1.4 Integration Tests Give Best ROI

**Impact: CRITICAL**

Excessive mocking destroys integration confidence. Every mock is a gap.

> "The more you mock, the less confidence you get from your tests."

**Incorrect (heavy mocking):**
```typescript
vi.mock('../api/users')
vi.mock('../hooks/useAuth')
vi.mock('../utils/format')

it('renders the user card', () => {
  ;(useAuth as vi.Mock).mockReturnValue({ user: mockUser })
  ;(formatName as vi.Mock).mockReturnValue('John D.')
  render(<UserCard userId="1" />)
  expect(screen.getByText('John D.')).toBeInTheDocument()
})
```

**Correct (real hooks, MSW for network):**
```typescript
it('renders the user card with fetched data', async () => {
  render(<UserCard userId="1" />)
  expect(await screen.findByText('John Doe')).toBeInTheDocument()
})
```

---

## 2. User Perspective

### 2.1 Never Test Implementation Details

**Impact: CRITICAL**

Implementation details: internal state names, private methods, component instance methods. Testing them causes:
- **False negatives**: Tests break on refactor even though behavior unchanged
- **False positives**: Tests pass even though app is broken

**Incorrect:**
```typescript
it('sets isOpen to true when button clicked', () => {
  const wrapper = mount(<Accordion />)
  wrapper.find('button').simulate('click')
  expect(wrapper.state('isOpen')).toBe(true)
})
```

**Correct:**
```typescript
it('reveals content when button clicked', async () => {
  const user = userEvent.setup()
  render(<Accordion title="FAQ" content="Answer here" />)
  expect(screen.queryByText('Answer here')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'FAQ' }))
  expect(screen.getByText('Answer here')).toBeInTheDocument()
})
```

---

### 2.2 Avoid the Test User

**Impact: CRITICAL**

Two legitimate users: end-user (interacts with UI) and developer-user (passes props). A "test user" accesses internal state and private methods nobody else cares about.

> "Nobody cares about the testing user. The testing user doesn't pay the bills like the end user."

**Incorrect (test user — accessing internal hook API):**
```typescript
it('calls onSubmit with form values', () => {
  const { result } = renderHook(() => useForm())
  act(() => result.current.setField('email', 'a@b.com'))
  act(() => result.current.handleSubmit())
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

---

### 2.3 Refactoring Must Not Break Tests

**Impact: CRITICAL**

> "You should very rarely have to change tests when you refactor code."

Signs you're testing implementation details:
- Test breaks when you rename a variable
- Test breaks when you move logic to a custom hook
- Test breaks when you swap `useState` for `useReducer`
- Test requires importing the component's internal utilities

**Incorrect (coupled to internal structure):**
```typescript
import { calculateTotal } from '../utils/cart'

it('calculateTotal sums line items', () => {
  expect(calculateTotal([{ price: 10, qty: 2 }])).toBe(20)
})
```

**Correct (testing through public interface):**
```typescript
it('displays the correct order total', async () => {
  render(<CartSummary items={[{ name: 'Widget', price: 10, qty: 2 }]} />)
  expect(screen.getByText('Total: $20.00')).toBeInTheDocument()
})
```

---

## 3. Network Mocking

### 3.1 Use MSW Instead of Mocking Fetch

**Impact: HIGH**

Never `vi.mock` fetch, axios, or other HTTP clients. Use MSW. MSW intercepts at the network level — your actual fetch code runs, only the response is controlled.

**Incorrect:**
```typescript
vi.mock('../api/client')
it('displays users', async () => {
  ;(apiClient.get as vi.Mock).mockResolvedValue({ data: [{ id: 1, name: 'Alice' }] })
  render(<UserList />)
  expect(await screen.findByText('Alice')).toBeInTheDocument()
})
```

**Correct:**
```typescript
// Default handler in handlers.ts
http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'Alice' }]))

it('displays users', async () => {
  render(<UserList />)
  expect(await screen.findByText('Alice')).toBeInTheDocument()
})

// Override per-test for error cases
it('shows error state', async () => {
  server.use(http.get('/api/users', () => HttpResponse.error()))
  render(<UserList />)
  expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
})
```

---

### 3.2 Reuse MSW Handlers Across Tests and Dev

**Impact: HIGH**

```
src/mocks/
  handlers.ts   ← shared
  browser.ts    ← dev server
  server.ts     ← test server
```

**vitest.setup.ts:**
```typescript
import { server } from './src/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

Use `onUnhandledRequest: 'error'` — unhandled requests fail loudly instead of silently returning nothing.

---

## 4. React Testing Library

### 4.1 Query Priority — Accessibility-First Order

**Impact: HIGH**

Testing Library defines three tiers. Always try higher tiers first.

**Tier 1 — Accessible to everyone (visual + AT users):**
1. `ByRole` — matches every element in the accessibility tree; can't find it = accessibility bug
2. `ByLabelText` — best for form fields; mirrors screen reader navigation
3. `ByPlaceholderText` — fallback only; placeholder is not a label substitute
4. `ByText` — non-interactive elements; visible text is how users find content
5. `ByDisplayValue` — pre-filled inputs, selects, textareas

**Tier 2 — Semantic queries (variable AT support):**

6. `ByAltText` — images and alt-text elements
7. `ByTitle` — least reliable; not consistently read by screen readers

**Tier 3 — Last resort:**

8. `ByTestId` — users can't see or hear `data-testid`; use only when no accessible query works

**getByRole options:**
```typescript
// Accessible name (label, aria-label, text content)
screen.getByRole('button', { name: /submit/i })

// Heading level
screen.getByRole('heading', { level: 2 })

// State filters
screen.getByRole('checkbox', { checked: true })
screen.getByRole('tab', { selected: true, name: /settings/i })
screen.getByRole('button', { expanded: false })

// Include elements hidden from accessibility tree
screen.getAllByRole('button', { hidden: true })

// Accessible description
screen.getByRole('alertdialog', { description: /session is about to expire/i })
```

**Incorrect:**
```typescript
const btn = screen.getByTestId('submit-button')
const input = screen.getByTestId('email-input')
const heading = screen.getByTestId('section-title')
```

**Correct:**
```typescript
const btn = screen.getByRole('button', { name: /submit/i })
const input = screen.getByLabelText(/email address/i)
const heading = screen.getByRole('heading', { level: 2, name: /account settings/i })
```

If `getByRole` can't find your element → fix the component's accessibility, don't reach for `getByTestId`.

---

### 4.2 Always Use screen.*

**Impact: HIGH**

Never destructure from `render()`. Always use `screen.*`.

**Incorrect:**
```typescript
const { getByText, getByRole } = render(<MyComponent />)
const wrapper = render(<MyComponent />)
```

**Correct:**
```typescript
render(<MyComponent />)
screen.getByRole('heading', { name: /welcome/i })

// When render result needed:
const view = render(<MyComponent initialCount={0} />)
view.rerender(<MyComponent initialCount={5} />)
```

---

### 4.3 Use userEvent Over fireEvent

**Impact: HIGH**

`userEvent` triggers the full event chain; `fireEvent` fires only one event.

**Incorrect:**
```typescript
fireEvent.click(screen.getByRole('button'))
fireEvent.change(input, { target: { value: 'abc' } })
```

**Correct:**
```typescript
const user = userEvent.setup()
await user.click(screen.getByRole('button', { name: /submit/i }))
await user.type(screen.getByLabelText(/email/i), 'a@b.com')
```

---

### 4.4 Correct Query Variants — get* vs query* vs find*

**Impact: HIGH**

| Variant | Use when | Throws if missing? | Async? |
|---------|----------|-------------------|--------|
| `get*` | Element must exist right now | Yes | No |
| `query*` | Asserting element does NOT exist | No | No |
| `find*` | Element will appear after async work | Yes (after timeout) | Yes |

**Incorrect:**
```typescript
// query* returns null — can silently pass when element never renders
const heading = screen.queryByRole('heading')
expect(heading).toBeInTheDocument()

// get* throws before async resolves
screen.getByText('Loaded data')
```

**Correct:**
```typescript
expect(screen.getByRole('button')).toBeEnabled()                    // must exist now
expect(screen.queryByRole('dialog')).not.toBeInTheDocument()        // must not exist
expect(await screen.findByText('Alice')).toBeInTheDocument()        // async
```

---

### 4.5 Don't Wrap in act() Manually

**Impact: HIGH**

`render`, `fireEvent`, `userEvent` are already wrapped. Manual `act()` wrapping suppresses real warnings.

**act() warnings signal real bugs** — state updating after test cleanup. Fix root cause, don't suppress.

**Incorrect:**
```typescript
act(() => { render(<Counter />) })
act(() => { fireEvent.click(screen.getByRole('button')) })
```

**Correct:**
```typescript
const user = userEvent.setup()
render(<Counter />)
await user.click(screen.getByRole('button'))
expect(screen.getByText('Count: 1')).toBeInTheDocument()
```

**When act IS needed:** advancing fake timers, `renderHook` + manual state updates.

---

### 4.6 waitFor — Single Assertion, No Side Effects

**Impact: HIGH**

`waitFor` retries its callback. Two rules:
1. One assertion per callback
2. No side effects inside (callback may execute multiple times)

**Incorrect:**
```typescript
await waitFor(() => {
  expect(screen.getByText('Alice')).toBeInTheDocument()
  expect(screen.getByText('Bob')).toBeInTheDocument()  // delayed failure detection
  fireEvent.click(screen.getByRole('button'))           // executes multiple times!
})
```

**Correct:**
```typescript
// Prefer find* over waitFor(() => get*())
expect(await screen.findByText('Alice')).toBeInTheDocument()

// waitFor for spy assertions
await waitFor(() => expect(mockFn).toHaveBeenCalledWith('expected'))
```

---

### 4.7 Name Render Result 'view' Not 'wrapper'

**Impact: MEDIUM**

`wrapper` implies Enzyme. Use `view` if you need the render result at all.

**Incorrect:** `const wrapper = render(<MyComponent />)`

**Correct:**
```typescript
// Most cases — just render, use screen
render(<MyComponent />)

// When needed
const view = render(<MyComponent />)
view.rerender(<MyComponent newProp />)
```

---

## 5. Test Structure

### 5.1 Flat Tests Over Deep Nesting

**Impact: MEDIUM**

Deep `describe` + `beforeEach` nesting = mutable shared state + cognitive overhead.

**Incorrect:**
```typescript
describe('UserCard', () => {
  let user: User
  beforeEach(() => { user = createUser() })
  describe('when authenticated', () => {
    beforeEach(() => { user.isAuthenticated = true })
    describe('when premium', () => {
      beforeEach(() => { user.isPremium = true })
      it('shows premium badge', () => { ... })
    })
  })
})
```

**Correct:**
```typescript
it('shows premium badge for authenticated premium users', () => {
  render(<UserCard user={{ isAuthenticated: true, isPremium: true, name: 'Alice' }} />)
  expect(screen.getByText('Premium')).toBeInTheDocument()
})
```

---

### 5.2 AHA — Abstract After Third Repetition

**Impact: MEDIUM**

> "Prefer duplication over the wrong abstraction. Optimize for change first."

Duplicate once, duplicate twice — that's fine. Abstract when you see the pattern a third time and its true shape is clear.

**Incorrect (premature abstraction):**
```typescript
function renderWithUser(overrides = {}) {
  return render(<UserCard user={{ name: 'Alice', role: 'admin', ...overrides }} />)
}
// Used in only one test — abstraction hides what matters
```

**Correct (inline first, abstract when pattern is proven):**
```typescript
// Tests 1-2: inline
render(<UserCard user={{ name: 'Alice', role: 'admin', email: 'a@b.com' }} />)

// Test 3+: now abstract with confidence
function renderUserCard(overrides: Partial<User> = {}) {
  const user = { name: 'Alice', role: 'user', email: 'a@b.com', ...overrides }
  return render(<UserCard user={user} />)
}
```

---

### 5.3 No Conditionals or Loops — Parameterize or Split

**Impact: MEDIUM**

Tests must have a single, linear code path.

- **`if` statements** — one test secretly covering two branches; one branch may never run
- **`for`/`forEach` loops** — one failure stops remaining iterations; test name doesn't identify which case failed

Use `it.each`/`describe.each` for same-behavior-different-data scenarios. Split into separate tests when scenarios differ meaningfully.

**Incorrect (loop + conditional — hides which case failed):**
```typescript
it('displays the correct icon', () => {
  ['active', 'inactive', 'pending'].forEach((status) => {
    render(<StatusBadge status={status} />)
    if (status === 'active') {
      expect(screen.getByRole('img', { name: /active/i })).toBeInTheDocument()
    } else {
      expect(screen.getByRole('img', { name: /inactive/i })).toBeInTheDocument()
    }
  })
})
```

**Correct (it.each — each iteration is an independent named test):**
```typescript
it.each([
  { status: 'active',   expectedLabel: /active/i  },
  { status: 'inactive', expectedLabel: /inactive/i },
  { status: 'pending',  expectedLabel: /pending/i  },
])('displays the $expectedLabel icon for $status status', ({ status, expectedLabel }) => {
  render(<StatusBadge status={status} />)
  expect(screen.getByRole('img', { name: expectedLabel })).toBeInTheDocument()
})
```

**Correct (multiple assertions without a loop — all run, failures are precise):**
```typescript
it('renders all items in the list', () => {
  render(<ItemList items={['Widget', 'Gadget', 'Doohickey']} />)
  expect(screen.getByText('Widget')).toBeInTheDocument()
  expect(screen.getByText('Gadget')).toBeInTheDocument()
  expect(screen.getByText('Doohickey')).toBeInTheDocument()
})
```

**`it.each` vs split tests:**
- `it.each` — same test body, different data
- Split tests — different behavior, not just different data

---

### 5.4 Self-Contained Tests — Inline Setup

**Impact: MEDIUM**

Each test should be fully understandable without reading surrounding scopes. Use factory functions called inside tests, not `beforeEach` for state setup.

**Reserve `beforeEach`/`afterEach` for:**
- Server start/stop
- `vi.restoreAllMocks()`
- `server.resetHandlers()`
- Console spy setup/restore

**Incorrect:**
```typescript
let mockData: ResponseData
beforeEach(() => { mockData = generateMockData() })

it('renders items', () => {
  render(<List data={mockData} />)  // what is mockData? must look elsewhere
})
```

**Correct:**
```typescript
it('renders items', () => {
  const data = buildResponseData({ items: [{ name: 'Widget' }] })
  render(<List data={data} />)
  expect(screen.getByText('Widget')).toBeInTheDocument()
})
```

---

## 6. Coverage Strategy

### 6.1 Cover Critical Business Paths, Not Lines

**Impact: MEDIUM**

Coverage is a diagnostic tool. Run `vitest run --coverage`, look for red on critical paths: auth flows, payment paths, data mutations, user-facing error states.

Don't write tests to turn lines green. Write tests when you find an untested path that matters to users.

---

### 6.2 E2E — Test Critical Workflow Once, Use Programmatic Setup

**Impact: MEDIUM**

Test each UI workflow once. For tests that require that state, use HTTP/API setup instead of re-running the UI workflow.

**Incorrect:**
```typescript
// Login flow repeated in every test — zero new confidence each time
test('can view dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'user@example.com')
  // ...
})
```

**Correct:**
```typescript
// One test exercises the login UI
test('user can log in via the login form', async ({ page }) => { ... })

// All others: programmatic auth
test.beforeEach(async ({ page, request }) => {
  const { token } = await request.post('/api/auth/login', { ... }).then(r => r.json())
  await page.context().addCookies([{ name: 'auth', value: token, ... }])
})
```

---

### 6.3 No Redundant Workflow Repetition

**Impact: MEDIUM**

Before adding a test, check: is any part of this interaction already verified elsewhere? If yes, start from the post-workflow state.

Every repeated workflow = extra CI time, zero confidence gain.

**Incorrect:**
```typescript
async function registerAndLogin() { /* full UI flow */ }
it('can view dashboard', async () => { await registerAndLogin(); ... })
it('can update profile', async () => { await registerAndLogin(); ... })
it('can create a project', async () => { await registerAndLogin(); ... })
```

**Correct:**
```typescript
it('user can register and is redirected to dashboard', async () => {
  const user = userEvent.setup()
  /* one UI test using user.click(), user.type() etc. */
})

it('can update profile', async () => {
  renderAuthenticated(<App />)  // factory handles auth state
  // ...
})
```

---

## Quick Rules Checklist

When writing or reviewing a test, verify:

- [ ] Test resembles how real users interact with the software
- [ ] No internal state, private methods, or component instances accessed
- [ ] Network requests mocked via MSW, not `vi.mock(fetch)`
- [ ] Queries use `ByRole` first, `ByTestId` only as last resort
- [ ] Using `screen.*`, not destructured from `render()`
- [ ] Using `userEvent` not `fireEvent` for user interactions
- [ ] Correct variant: `get*` for must-exist, `query*` for must-not-exist, `find*` for async
- [ ] No manual `act()` wrapping; act warnings investigated not suppressed
- [ ] `waitFor` has single assertion, no side effects inside
- [ ] Test is flat and self-contained; `beforeEach` only for cleanup
- [ ] No hasty abstraction; pattern duplicated at least twice before abstracting
- [ ] No `if`/ternaries/loops in test body; use `it.each`/`describe.each` or split into separate tests
- [ ] Critical path coverage; not chasing 100%
