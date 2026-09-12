# @ovr/db

## 0.1.1

### Patch Changes

- [#181](https://github.com/open-visual-regression/open-visual-regression/pull/181) [`37027a0`](https://github.com/open-visual-regression/open-visual-regression/commit/37027a0d7d3df3b87d11a7e47bedac2498838f39) Thanks [@tgfischer](https://github.com/tgfischer)! - Stop an idle database connection from crashing the process.

  The connection pool had no `error` listener. node-postgres emits `error` on the
  pool when a backend or network fault hits an **idle** client, and an `error`
  event with no listener becomes an uncaught exception — so the process exited 1
  and the container restarted.

  Neon's pooler drops idle connections, so the worker hit this whenever it sat
  between builds: three restarts over eight days in the dogfood deployment, each
  after hours of inactivity, all `Connection terminated unexpectedly` thrown from
  `Client.idleListener`. The pool already replaces dead clients on its own; it
  just needed the fault logged instead of thrown.

  Web was unaffected in practice only because its traffic kept connections from
  going idle.

- [#175](https://github.com/open-visual-regression/open-visual-regression/pull/175) [`dff0593`](https://github.com/open-visual-regression/open-visual-regression/commit/dff059342ca035643a693fb6a459a3d948a451ee) Thanks [@tgfischer](https://github.com/tgfischer)! - Only mark a snapshot errored when the story itself failed to render.

  An uncaught exception seen through Playwright's `pageerror` event was folded
  into `hasRenderError`, alongside the render and play failures Storybook reports
  over its own channel. A story that rendered correctly and then threw — an error
  a boundary already recovered from, or one raised from a timer after the story
  finished — was marked errored, skipped its diff, and failed its build, even
  though its screenshot was perfectly usable.

  `hasRenderError` now comes only from Storybook's render and play result. The
  `pageerror` signal is kept separately as `hasUncaughtPageError`, which leaves
  the snapshot diffable and raises a warning on it instead. A snapshot also
  records the reason it errored in `errorMessage`, so it names what went wrong
  rather than always reading "This snapshot failed to capture", and a build whose
  snapshots errored says so instead of reporting a failure to diff against a
  baseline.
