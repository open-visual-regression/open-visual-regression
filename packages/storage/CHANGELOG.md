# @ovr/storage

## 0.1.1

### Patch Changes

- [#488](https://github.com/open-visual-regression/open-visual-regression/pull/488) [`479d610`](https://github.com/open-visual-regression/open-visual-regression/commit/479d61032e7f4c6a5c7cf446ef412f4caafe4daa) Thanks [@tgfischer](https://github.com/tgfischer)! - Deleting an expired build or project no longer leaves files behind in object storage when the store rejects some deletes, for example when throttled. Leftovers are retried on the next nightly purge.

- [#489](https://github.com/open-visual-regression/open-visual-regression/pull/489) [`4972a24`](https://github.com/open-visual-regression/open-visual-regression/commit/4972a24b5ad6dfd46eb2d1cf9f9464f61c1bbf5c) Thanks [@tgfischer](https://github.com/tgfischer)! - Metrics, alerts, and dashboard panels cover object storage: request failures and latency, deleted files, and files of purged builds or projects left in storage.
