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
lined up the way `git diff` lines up text: rows that occur once on each side
anchor the alignment, and a Myers diff (`@jest/diff-sequences`) fills in
between them. Rows that match only moved.

Rows that don't match are lined up again by column, which picks up
horizontal shifts such as a wider sidebar, then by row inside the columns that
don't match, and so on for a few levels. When the band between a shared header
and footer splits at solid gutters, like a fixed sidebar next to a main column
whose content moved, each strip can line up on its own instead.

The result is the baseline rearranged into the current image's coordinates.
Inserted lines are filled from the baseline line next to them, so blank space
that only grew compares equal. One pixelmatch pass then compares the
rearranged baseline with the current image, so the cost stays close to a plain
pixel diff whatever changed.

## Limits

- Content that reflows in two directions at once, such as cards wrapping onto
  the next row of a grid, can only be partly lined up.
- Rows have to match exactly to line up. If anti-aliasing changes along with
  a move, that part falls back to a plain pixel comparison.

## Fixtures

The tests use Chromium screenshots of a sample page in
`src/__tests__/fixtures/aligned`. Regenerate them with `pnpm generate:fixtures`,
setting `CHROMIUM_PATH` to use a browser other than Playwright's.
