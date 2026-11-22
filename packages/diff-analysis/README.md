# @ovr/diff-analysis

Compares two screenshots.

- `alignedDiff` marks what changed between them without counting content that
  only moved, and `renderDiff` draws that as the diff image OVR shows.
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
pixel diff would.

Removed content has no place in the current image, so where it was is
highlighted instead, wherever it differs from what's there now. When that spot
looks the same as before, like a segment gone from a bar where the one beside
it has the same color, the rest of that row is highlighted wherever it differs.

When only the space between rows changed, like a margin that grew or shrank,
the first block of content below it moved because of it, so that block is
highlighted wherever it differs. Only something that changes height, like new
content, removed content or another spacing change further up in the same
columns, explains a shift, so then nothing extra is highlighted. Something that
changed in place, like a recolored badge, doesn't. If
nothing explains a difference at all, the plain pixel diff is shown, so a
failing snapshot always shows something.

## Limits

- Content that reflows in two directions at once, such as cards wrapping onto
  the next row of a grid, can only be partly lined up.
- Rows have to match exactly to line up. If anti-aliasing changes along with
  a move, that part falls back to a plain pixel comparison.
