# @ovr/image-diff

Compares two screenshots without counting content that only moved. When a
banner appears at the top of a page, a plain pixel diff marks everything below
it as changed. This package reports the banner as the one change.

```ts
import { alignedDiff } from "@ovr/image-diff/alignedDiff";
import { renderDiff } from "@ovr/image-diff/renderDiff";

const diff = alignedDiff(baseline, current);
diff.changedPixelCount; // pixels that really changed
diff.regions; // [{ kind: "inserted" | "deleted" | "modified", current, baseline }]
const overlay = renderDiff(diff); // transparent overlay: red changes, green insertions
```

## How it works

Every pixel row of both images is hashed, and the two lists of hashes are
lined up with a Myers diff (`@jest/diff-sequences`), the same way `git diff`
lines up lines of text. Rows that match are treated as moved, not changed.

The rows that don't match are explained again, alternating between columns
and rows, which picks up horizontal shifts such as a wider sidebar. Side-by-
side columns separated by solid gutters, like a fixed sidebar next to a main
column that scrolled, can also line up on their own. For each piece we keep
whichever explanation flags the fewest pixels, and blank space that grew or
shrank never counts.

## Limits

- Content that reflows in two directions at once, such as cards wrapping onto
  the next row of a grid, can only be partly lined up.
- Rows have to match exactly to line up. If anti-aliasing changes along with
  a move, that part falls back to a plain pixel comparison.

## Fixtures

The tests use Chromium screenshots of a sample page in
`src/__tests__/fixtures/aligned`. Regenerate them with `pnpm generate:fixtures`,
setting `CHROMIUM_PATH` to use a browser other than Playwright's.
