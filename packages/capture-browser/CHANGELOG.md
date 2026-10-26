# @ovr/capture-browser

## 0.0.4

### Patch Changes

- [#452](https://github.com/open-visual-regression/open-visual-regression/pull/452) [`6084a1e`](https://github.com/open-visual-regression/open-visual-regression/commit/6084a1e6b626ee8e834ce539acac16693ef708fa) Thanks [@tgfischer](https://github.com/tgfischer)! - Capture browsers that fail to close are now force-killed, so they no longer leak memory in the worker.

## 0.0.3

### Patch Changes

- [#448](https://github.com/open-visual-regression/open-visual-regression/pull/448) [`be8ac27`](https://github.com/open-visual-regression/open-visual-regression/commit/be8ac27a964d19ff424025a39be3dfeca562c24e) Thanks [@tgfischer](https://github.com/tgfischer)! - Captures wait for requests a service worker answers, like delayed msw mocks, instead of screenshotting the loading state.

- [#447](https://github.com/open-visual-regression/open-visual-regression/pull/447) [`77ca17f`](https://github.com/open-visual-regression/open-visual-regression/commit/77ca17f0a6e0436fe323d313e495d0288da5f55d) Thanks [@tgfischer](https://github.com/tgfischer)! - Captures load lazy images and iframes up front, so images below the viewport are no longer missing or half-loaded in full-page screenshots.

- [#446](https://github.com/open-visual-regression/open-visual-regression/pull/446) [`644afd4`](https://github.com/open-visual-regression/open-visual-regression/commit/644afd402a84a41334eae028e4abbcba255a3683) Thanks [@tgfischer](https://github.com/tgfischer)! - Captures wait for the DOM to stop changing and for loaded images to decode, not just for the network to go quiet, so a story that renders in waves is no longer captured halfway.

## 0.0.2

### Patch Changes

- [`e688833`](https://github.com/open-visual-regression/open-visual-regression/commit/e688833724d681410ff28162830281f262af43c1) Thanks [@tgfischer](https://github.com/tgfischer)! - Upgrade Playwright to 1.64.1, so the worker runs on Node.js 24.22.1 and captures use Chromium 156.

## 0.0.1

### Patch Changes

- Updated dependencies [[`23e1da3`](https://github.com/open-visual-regression/open-visual-regression/commit/23e1da30b5606550e9d978e4ed9483907e94c870), [`fccbfcc`](https://github.com/open-visual-regression/open-visual-regression/commit/fccbfcc46567472de7a49078064e1a3bdb8cbb63), [`54c5823`](https://github.com/open-visual-regression/open-visual-regression/commit/54c5823f5c585f0b144ecaf0c60a59d056a7ad66), [`7a5880b`](https://github.com/open-visual-regression/open-visual-regression/commit/7a5880b45693cb7646e6012d4d3573a7041dc726)]:
  - @ovr/storybook-compat@0.4.0
