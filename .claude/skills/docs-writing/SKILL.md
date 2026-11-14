---
name: docs-writing
description: Write or change pages on the OVR documentation site in `apps/docs` (Mintlify). Use whenever adding, editing, moving, or reviewing a docs page, when a change needs documenting, or when asked to "update the docs" or "document" a feature, flag, setting, or behavior.
---

The docs at [docs.openvisualregression.com](https://docs.openvisualregression.com) are built with Mintlify from `apps/docs`. The navigation, tabs, and redirects are in `apps/docs/docs.json`.

## Who reads the docs

Two kinds of people, and neither reads the code:

- **The operator** sets up and runs OVR: Docker Compose or Helm, Postgres, Redis, object storage, SSO, monitoring.
- **The user** uploads builds from CI, reviews them, runs the CLI, and manages projects and people in the web app.

Write for them. They want to know what OVR does, what they can set, and what to do when something goes wrong. They don't need to know how it's built.

## Process

1. Find the page where a reader would look for the thing you're documenting. A change that says "document X" doesn't mean appending a sentence to the nearest page.
2. Read the whole page before changing it, and match its length and character. Fill a gap. Don't turn a short guide into an exhaustive one.
3. Check every fact against the code: defaults, limits, roles, statuses, error messages, and UI labels. Copy UI labels from the components.
4. If the change makes an existing sentence wrong, fix that sentence instead of adding a new one.
5. Re-read the page as a whole, then run the checks below.

## Voice

- Write to the reader as "you", in the present tense. Describe the product as it is today, not how it changed.
- Lead with what the reader sees or has to do. Add how it works only when that explains what they see.
- Keep sentences short and plain. One idea per sentence, no semicolons.
- State facts. Don't sell: no "powerful", "seamless", "simply", "just", "easily".
- Don't justify a design decision unless the reader has to act on the reason. "This is safe because…" usually belongs in the PR description.
- Avoid "not X, but Y" and "rather than" framing when a plain statement works. Say what it does.
- Use contractions (it's, don't, can't).

## What belongs on a page

Ask of every sentence: does it change what the reader does or expects? If not, cut it.

- **Keep:** defaults, limits, required settings, error messages the reader will see, and behavior that would surprise them.
- **Cut:** how something is implemented, input validation details ("rejected before the request is sent"), how output is formatted when the example already shows it, and edge cases that don't lead to an action.
- **Elsewhere:** migration steps go on `self-hosting/upgrading.mdx`. Release notes go in changesets (see the `changesets` skill).

## One place for each fact

Every setting, default, and behavior is described on one page. Other pages link to it.

- Environment variables live in `reference/environment-variables.mdx`, with their Helm values. Install guides list only what you need to set to get running.
- Flags shared by every CLI command live in `cli/overview.mdx`.
- Repeated text, like "needs the `builds:write` permission", is a snippet in `snippets/`, imported with `import Name from "/snippets/name.mdx"`.

## Sources

OVR captures Storybook today. Keep the general pages independent of it, so another source can sit beside Storybook later without rewriting them.

- Pages outside the **Storybook** group (`storybook/`) shouldn't need the words "Storybook" or "story" to make sense. If they do, that content belongs in the Storybook group, linked from the general page.
- Don't mention sources OVR doesn't support.

## Terms

Use these words for these things, and only these:

| Term | Meaning |
| --- | --- |
| **project** | A UI you test. It has a main branch, API keys, and settings |
| **build** | One upload for one commit on one branch |
| **snapshot** | One captured image, identified by its name, viewport, and browser |
| **baseline** | The approved snapshot a new snapshot is compared against |
| **diff** | The comparison between a snapshot and its baseline |
| **review** | Approving or rejecting diffs |
| **API key** | A project's key, used to upload builds |
| **access token** | A person's token, used by the CLI's other commands |

Write roles in lowercase: admin, reviewer, viewer.

## Formatting

- Sentence case for titles and headings. The page's H1 comes from the `title` frontmatter, so don't add one.
- UI labels in bold, exactly as the app shows them. The app uses lowercase labels: **view baseline**, **approve all**. Settings paths use arrows: **Settings → Jobs**.
- Code formatting for anything the reader types or sees literally: commands, flags, config keys, environment variables, statuses, error messages.
- Use a table for a list of options. Use `<Steps>` for a procedure the reader follows in order.
- Use callouts (`<Note>`, `<Warning>`) sparingly. A warning is for something that loses data or breaks a deployment.
- Use `https://ovr.example.com` for the OVR URL in examples.

## Examples

Each pair is a real sentence from these docs and what it became. The bad version is what tends to appear when a PR's details get pasted onto the nearest page.

### Implementation detail

Bad:

> To publish a status, OVR signs a short JWT with the App's private key, looks up the App's installation for the repository, and exchanges the JWT for an installation token. Installation tokens expire after an hour. Each web and worker process caches its installation tokens in memory, one per installation, and replaces a token five minutes before it expires.

Good:

> A GitHub App avoids that: the statuses come from the App, and the App's private key is the only credential you look after.

The operator can't act on how tokens are cached. What they need to know is what to look after.

### Test cases written as prose

Bad:

> `--status` accepts `queued`, `processing`, …, and `canceled`; anything else is rejected before the request is sent. When filters match nothing, the applied filters are printed alongside `No builds found.` so a mistyped branch or author is visible.

Good:

> `--status` takes `queued`, `processing`, `needs_review`, `unchanged`, `auto_approved`, `approved`, `rejected`, `error`, and `canceled`.

Where validation happens, and what an empty result prints, doesn't change what the reader types.

### Chains of qualifications

Bad:

> Minutes an unfinished build can go without snapshot or diff updates before it is marked errored. A build with capture, diff or finalize jobs still queued, retrying or running is never reaped, however long it waits.

Good:

> Minutes an unfinished build can go without progress, with no work left queued, before it's marked as failed.

Say the rule once, in the reader's terms. Leave internal job names out.

### Justifying the design

Bad:

> It still appears on the build as `skipped`, so a story that stopped being checked is visible rather than silently missing.

Good:

> It's still listed on every build as `skipped`, so you can see which stories aren't checked.

Tell the reader what they can do with it, and drop the "rather than" contrast.

### Selling

Bad:

> That gap matters more as more UI code gets written by AI agents. A generated change can compile, pass its tests, and still be visually wrong in a way that's easy to miss in a text-based review. Asking an AI to look at a screenshot and judge whether it looks right helps, but that judgment is non-deterministic and rarely covers every breakpoint and state a change could touch.

Good:

> That's easy to miss in a code review, whether a person or an AI agent wrote the change.

One clause makes the point. A paragraph about it reads like marketing.

### Tying a general page to Storybook

Bad, on the general flaky detection page:

> Flaky stories show a badge on their snapshot card on the build page and next to the status on the snapshot page.

Good:

> A flaky snapshot has a **flaky** badge on the build page and on the snapshot page.

Storybook-only advice, like a chart library's animation, goes on `storybook/stable-screenshots.mdx`, linked from the general page.

### Appending instead of placing

Bad: a change made pages stream, and the same paragraph about turning off proxy buffering was appended to both the Docker Compose and Helm pages.

Good: the explanation lives once, in the self-hosting overview's **Reverse proxies** section. The Compose and Helm pages each have one sentence that links to it.

## Moving or renaming a page

Add a redirect from the old path in `docs.json`, and update every internal link to the new path.

## Checks

```sh
pnpm --filter @ovr/docs check-links  # broken links, run in CI
pnpm --filter @ovr/docs validate     # Mintlify's page and navigation checks, needs internet access
```

`check-links` doesn't verify `#anchor` links, so check that any heading you link to exists.
