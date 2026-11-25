# @ovr/diff-analysis

Compares two screenshots.

- `alignedDiff` marks what changed between them on each of them, like a code
  diff: what was removed or changed on the baseline, what was added or
  changed on the new screenshot, and not content that only moved. `renderDiff`
  draws each side as the tinted overlay OVR shows over that image.
- `analyzeDiff` describes the difference for the CLI: the area that changed,
  whether the content shifted, and whether the screenshot changed size.

## How `alignedDiff` works

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
pixel diff would. A changed pixel is marked on the new screenshot, and on the
baseline at the spot it was lined up with.

Lines the alignment found added are marked on the new screenshot, and lines it
found removed on the baseline, where they are. Blank space added or removed,
like a margin that grew or shrank, is marked too, kept to the part with
content beside it, or to the whole element when it's inside one, like padding
that grew. Space isn't marked when it only pads the page out to its height, or
when it made room for content added before it, or filled in for content
removed before it, so the box around them kept its size. If nothing explains a
difference at all, every changed pixel is marked in place, so a failing
snapshot always shows something.

## Limits

- Content that reflows in two directions at once, such as cards wrapping onto
  the next row of a grid, can only be partly lined up.
- Rows have to match exactly to line up. If anti-aliasing changes along with
  a move, that part falls back to a plain pixel comparison.
