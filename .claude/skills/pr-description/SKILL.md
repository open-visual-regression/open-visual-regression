---
name: pr-description
description: Write or update a pull request description using the repo's PR template. Use whenever creating a PR, opening a pull request, or asked to write, draft, or rewrite a PR description.
---

Write a short, high-level PR description that fills in `.github/pull_request_template.md`.

## Rules

- **Length:** 200-300 words at most. A human has to read this, so keep it quick to digest, but don't cut anything a reviewer needs to know to review the change safely (risky areas, migrations, follow-ups).
- **Altitude:** Describe the change, not the code. No file-by-file walkthroughs, function names, or implementation minutiae unless a reviewer needs them to understand the change.
- **Not a history:** Don't narrate the AI session, the order things were tried, dead ends, or decisions made along the way. Describe the end state only.
- **No attribution:** Don't add "Generated with Claude Code", `Co-Authored-By`, or session links to the description.
- **Sections:** Keep the template's headings (Why, What changed, Testing, Screenshots). Drop Screenshots if there is nothing visual.

## Sections

- **Why:** One or two sentences on the problem or goal. Link the issue if one exists.
- **What changed:** A few bullets on the approach, at the level you'd explain it to a teammate.
- **Testing:** What was exercised manually in the browser: the pages or flows visited and the behavior observed (including relevant edge cases). If the change has no user-facing surface, write "N/A" with a few words on why.

## Never list as testing

Typecheck, lint, format, unit tests, builds, or "CI passes". CI has to pass anyway, so these say nothing a reviewer doesn't already know.

## Process

1. Look at the full branch diff against the base branch, not just the latest commit.
2. If the change is user-facing and the app can be run, verify it in the browser first so the Testing section reports something that actually happened. Never claim testing that wasn't done.
3. Fill in the template and remove the HTML comments.
4. After the PR is created, re-read the description. The server may append a Claude attribution footer (e.g. "🤖 Generated with Claude Code" and a session link). If present, update the PR body to remove it, and do this without being asked.
