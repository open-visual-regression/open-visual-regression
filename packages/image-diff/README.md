# @ovr/image-diff

Compares two screenshots without counting content that only moved. When a
banner appears at the top of a page, a plain pixel diff marks everything below
it as changed. This package reports the banner as the one change.

```ts
import { alignedDiff } from "@ovr/image-diff/alignedDiff";
import { renderDiff } from "@ovr/image-diff/renderDiff";

const diff = alignedDiff(baseline, current);
diff.changedPixelCount; // pixels that really changed
diff.regions; // [{ kind: "inserted" | "deleted" | "modified" | "moved", current, baseline }]
diff.plainChangedPixelCount; // what a plain pixel diff counts, for pass or fail
const image = renderDiff(current, diff); // red for changes, green for insertions
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

A pixel only counts as changed when it also differs from the pixel at the same
spot in the baseline, so a misaligned stretch never flags more than a plain
pixel diff would. Content that appeared in one place and identical content that
disappeared from another, like two buttons that swapped, is reported as one
move. Blank space that grew isn't counted, but when that's the only difference
it's still shown as inserted, so a failing snapshot always shows something.

## Limits

- Content that reflows in two directions at once, such as cards wrapping onto
  the next row of a grid, can only be partly lined up.
- Rows have to match exactly to line up. If anti-aliasing changes along with
  a move, that part falls back to a plain pixel comparison.
