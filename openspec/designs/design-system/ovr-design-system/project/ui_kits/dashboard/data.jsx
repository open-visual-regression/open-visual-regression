/* global */
// OVR — mock data. The system under test is a fictional e-commerce app.

const PROJECTS = [
  { id: 'checkout-flow', name: 'checkout-flow',  changedCount: 3, runCount: 47,  description: 'cart, payment, confirmation flow' },
  { id: 'marketing',     name: 'marketing',      changedCount: 1, runCount: 128, description: 'public-facing pages — landing, pricing, blog' },
  { id: 'dashboard',     name: 'dashboard',      changedCount: 0, runCount: 89,  description: 'authenticated user dashboard' },
  { id: 'mobile-web',    name: 'mobile-web',     changedCount: 0, runCount: 34,  description: 'mobile-viewport snapshots' },
  { id: 'admin',         name: 'admin',          changedCount: 0, runCount: 12,  description: 'internal admin console' },
];

const RUNS_BY_PROJECT = {
  'checkout-flow': [
    { id: '1284', status: 'changed', changed: 3, total: 12, branch: 'pr/482', author: 'ari', commit: '4f2a91e', message: 'tune checkout button styling', age: '2m ago', duration: '2.4s' },
    { id: '1283', status: 'pass',    changed: 0, total: 12, branch: 'main',   author: 'jules', commit: 'e0b14c2', message: 'merge: refactor cart provider', age: '12m ago', duration: '2.2s' },
    { id: '1282', status: 'changed', changed: 1, total: 12, branch: 'main',   author: 'sam',   commit: 'a39c0d1', message: 'fix: cart total rounding', age: '1h ago', duration: '2.3s', approved: true },
    { id: '1281', status: 'pass',    changed: 0, total: 12, branch: 'main',   author: 'jules', commit: '7e22fa1', message: 'chore: bump deps', age: '3h ago', duration: '2.1s' },
    { id: '1280', status: 'fail',    changed: 0, total: 12, branch: 'pr/479', author: 'ari',   commit: '11ba9d3', message: 'wip: payment retry', age: '5h ago', duration: '0.4s', errorNote: 'baseline mismatch · viewport' },
    { id: '1279', status: 'pass',    changed: 0, total: 12, branch: 'main',   author: 'sam',   commit: '5cc2b07', message: 'feat: gift card field', age: '1d ago', duration: '2.6s' },
    { id: '1278', status: 'pass',    changed: 0, total: 12, branch: 'main',   author: 'jules', commit: 'fa1d903', message: 'cleanup: remove unused css', age: '1d ago', duration: '2.2s' },
    { id: '1277', status: 'changed', changed: 2, total: 12, branch: 'main',   author: 'ari',   commit: '8b3c0e9', message: 'tweak: hero copy', age: '2d ago', duration: '2.3s', approved: true },
  ],
  'marketing': [
    { id: '0892', status: 'changed', changed: 1, total: 24, branch: 'pr/214', author: 'mo',    commit: 'c4f001a', message: 'new pricing tier', age: '14m ago', duration: '4.1s' },
    { id: '0891', status: 'pending', changed: 0, total: 24, branch: 'pr/215', author: 'ari',   commit: 'b8e0f3c', message: 'wip: redesign footer', age: 'just now', duration: '—' },
    { id: '0890', status: 'pass',    changed: 0, total: 24, branch: 'main',   author: 'jules', commit: 'd2a1b54', message: 'merge: a11y fixes', age: '2h ago', duration: '4.0s' },
  ],
  'dashboard':  [{ id: '0556', status: 'pass', changed: 0, total: 18, branch: 'main', author: 'sam', commit: '0011aa2', message: 'merge: charts refactor', age: '3h ago', duration: '3.2s' }],
  'mobile-web': [{ id: '0331', status: 'pass', changed: 0, total: 42, branch: 'main', author: 'jules', commit: 'aa110bb', message: 'merge: responsive tweaks', age: '6h ago', duration: '5.8s' }],
  'admin':      [{ id: '0118', status: 'pass', changed: 0, total: 8,  branch: 'main', author: 'mo',  commit: '9e2c003', message: 'add: bulk approve action', age: '1d ago', duration: '1.4s' }],
};

// Snapshots for run #1284 specifically. 12 total, 3 changed.
const SNAPSHOTS_BY_RUN = {
  '1284': [
    { id: 'cart-empty',        name: 'cart-empty',                       viewport: '1280×800',  browser: 'chromium-117', status: 'changed', deltaPct: 0.42, mock: 'emptyCart',        diffMock: 'emptyCartChanged' },
    { id: 'cart-with-items',   name: 'cart-with-items',                  viewport: '1280×800',  browser: 'chromium-117', status: 'changed', deltaPct: 1.84, mock: 'checkoutPage',     diffMock: 'checkoutPageChanged' },
    { id: 'checkout-step-1',   name: 'checkout-step-1-address',          viewport: '1280×800',  browser: 'chromium-117', status: 'changed', deltaPct: 0.31, mock: 'confirmation',     diffMock: 'confirmationChanged' },
    { id: 'cart-empty-mob',    name: 'cart-empty.mobile',                viewport: '375×812',   browser: 'chromium-117', status: 'pass' },
    { id: 'cart-mob',          name: 'cart-with-items.mobile',           viewport: '375×812',   browser: 'chromium-117', status: 'pass' },
    { id: 'checkout-step-2',   name: 'checkout-step-2-payment',          viewport: '1280×800',  browser: 'chromium-117', status: 'pass' },
    { id: 'checkout-step-3',   name: 'checkout-step-3-review',           viewport: '1280×800',  browser: 'chromium-117', status: 'pass' },
    { id: 'confirmation',      name: 'confirmation',                     viewport: '1280×800',  browser: 'chromium-117', status: 'pass' },
    { id: 'confirmation-mob',  name: 'confirmation.mobile',              viewport: '375×812',   browser: 'chromium-117', status: 'pass' },
    { id: 'empty-state',       name: 'empty-state-no-items',             viewport: '1280×800',  browser: 'chromium-117', status: 'pass' },
    { id: 'error-state',       name: 'error-state-card-declined',        viewport: '1280×800',  browser: 'chromium-117', status: 'pass' },
    { id: 'modal',             name: 'cart-promo-modal',                 viewport: '1280×800',  browser: 'chromium-117', status: 'pass' },
  ],
};

// Recent runs flattened for the sidebar.
const RECENT_RUNS = [
  { id: '1284', projectId: 'checkout-flow', projectName: 'checkout-flow', status: 'changed' },
  { id: '0892', projectId: 'marketing',     projectName: 'marketing',     status: 'changed' },
  { id: '0891', projectId: 'marketing',     projectName: 'marketing',     status: 'pending' },
  { id: '1283', projectId: 'checkout-flow', projectName: 'checkout-flow', status: 'pass' },
  { id: '0890', projectId: 'marketing',     projectName: 'marketing',     status: 'pass' },
  { id: '0556', projectId: 'dashboard',     projectName: 'dashboard',     status: 'pass' },
];

Object.assign(window, { PROJECTS, RUNS_BY_PROJECT, SNAPSHOTS_BY_RUN, RECENT_RUNS });
