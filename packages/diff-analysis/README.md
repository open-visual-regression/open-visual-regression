# @ovr/diff-analysis

Describes how two screenshots differ: the area that changed, whether the content
shifted, and whether the screenshot changed size.

## Aligned diff (prototype)

`alignedDiff` in `src/alignedDiff.ts` compares two screenshots after aligning
them, so content that only moved is not reported as changed. A banner inserted
at the top is reported as one inserted region, rather than everything below it
turning red.

1. Hash every pixel row and run a Myers diff (the algorithm `git diff` uses on
   lines) over the two lists of row hashes. Equal rows match even when they
   moved; the unmatched runs between them are gaps.
2. Align each gap again on the other axis (pixel columns, then rows, and so
   on), which isolates horizontal shifts such as a wider sidebar.
3. For each gap, keep the cheapest explanation: a direct pixelmatch, the
   recursive alignment, or sliding the shorter side along the longer one.
   Inserted or deleted lines only cost what differs from the line next to
   them, so blank space that grew or shrank is free.

Regions come back as `modified`, `inserted` or `deleted`. A deletion is a
zero-height or zero-width line in the current image.

Known limits:

- One band of rows can only shift as a whole. If a column (for example the
  main content) moves vertically while a column beside it stays put, the
  part of the fixed column inside that band can be flagged too.
- Lines must match exactly before they can align. Anti-aliasing noise on
  shifted content can stop it from matching; it then falls back to pixelmatch.

Fixtures in `src/__tests__/fixtures/aligned` are Chromium screenshots of a
sample page:

- Regenerate them with `pnpm generate:fixtures`. Set `CHROMIUM_PATH` to use a
  system browser.
- See naive and aligned results side by side with
  `pnpm dlx tsx scripts/compareFixtures.ts <out-dir>`.
