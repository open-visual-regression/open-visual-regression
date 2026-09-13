---
"@open-visual-regression/cli": minor
---

Add `--json` to `ovr builds list` and `ovr builds get`.

Prints the raw build object(s) instead of the formatted table/text, so a
script or another program parsing the CLI's output doesn't have to scrape
plain text.
