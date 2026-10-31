---
name: changesets
description: Decide whether a change needs a changeset, pick the packages and bump types, and write the summary that ends up in CHANGELOG.md. Use whenever adding, writing, editing, or reviewing a changeset in `.changeset/`, before opening a PR that changes shipped behavior, or when asked to "add a changeset" or "write release notes" for a change.
---

A changeset is a markdown file in `.changeset/` that says which packages to release, at which semver level, and what to tell users about it. On the next release, `changeset version` pastes the summary verbatim into each listed package's `CHANGELOG.md` (with the PR link, commit, and author added by `@changesets/changelog-github`) and deletes the file. Write it as a release note for someone who upgrades and wants to know what will be different for them.

## Does this change need one?

Add a changeset when someone running OVR would notice the change: a feature, a bug fix, a behavior or default change, a performance change, a new config option or env var, a migration, a dependency or runtime upgrade that ships in the CLI or the Docker images, or a security fix.

Skip it for changes nobody running OVR can observe: tests, CI, repo tooling, docs-only changes, refactors that keep behavior identical, and dev-only dependency bumps.

When a feature lands across several PRs, the PRs that only add internal plumbing don't need a changeset. Add one in the PR that makes the feature usable, and describe the whole feature there. If an internal PR changes behavior on its own (a new index, a migration, a perf change), it gets its own changeset.

One changeset per user-facing change. If a PR makes two unrelated changes, or changes that need different bump types, write two files rather than one summary that does two jobs.

## Which packages to list

`@ovr/web` and `@ovr/worker` are a `fixed` group, so they always release together at the same version. `@open-visual-regression/cli` is the only package published to npm. Everything else is a private internal package that still gets versioned and a changelog.

- List every package whose code you changed in a way that affects behavior.
- Also list each app the change ships in (`@ovr/web`, `@ovr/worker`, and/or `@open-visual-regression/cli`), even if you didn't touch its code. That way the note shows up in the changelog people actually read, instead of a bare "Updated dependencies" line.
- Don't list packages you only touched for tests or types.

## Choosing the bump

Every package here is still on `0.x`, so:

- **patch:** Bug fixes, performance work, dependency and runtime upgrades, and internal packages changed only to support a change elsewhere.
- **minor:** New features, new options, and any breaking change or change to a default. Before 1.0, a minor bump is where breaking changes go.
- **major:** Don't use it. On `0.x` it releases `1.0.0`, which is a maintainer decision and not part of a normal PR.

The apps where users see the change get the meaningful bump. Internal packages that only support it get `patch`. For example, a new opt-in config option is `minor` for the CLI, web, and worker, and `patch` for `@ovr/capture`. If you're unsure between patch and minor for a user-facing change, choose minor.

## Writing the summary

The summary is for people who run OVR, not for reviewers. They don't know the codebase and won't open the PR.

- **Lead with what's different for the user.** Say what they can now do, what no longer goes wrong, or what behaves differently. Name the symptom they would have seen, not the code that caused it: "`--only-affected` no longer captures every story when…", not "Fix module graph traversal in `traceModules`".
- **Add the why, if it isn't obvious,** in a short "so …" clause or a second sentence: "…so images below the viewport are no longer missing in full-page screenshots."
- **Tell them what to do,** if anything. Name the exact config key, flag, env var, or Helm value to set, and give the old behavior back as an option when a default changes: "Set `OVR_CAPTURE_QUEUE_POLICY=fifo` to keep the previous order."
- **Call out side effects of upgrading,** like snapshots that will change once, a migration that runs, or something that now takes longer: "Stories that load images or fonts from another host may change once, since those now load."
- **Breaking changes** start with `**Breaking:**` and say what broke in the summary. Put the migration steps after it as a short list or a code block.
- **Tense and voice:** Describe the new behavior in the present tense, as in "Captures wait for…" or "Builds show how long…". "No longer" is good for fixes. Don't write "This PR…", "We…", or a commit-style "Fixed…".
- **Length:** Keep the summary under 30 words, which is usually one or two sentences. If it won't fit, cut implementation detail and background before cutting what the user has to do. Longer setup instructions belong in the docs, so link to the page instead of repeating it. The only exception is a breaking change, where the migration steps can follow the summary as a short list.
- **Formatting:** Use backticks for code, flags, config keys, env vars, and commands. Don't write a heading, since the changelog adds its own. Don't add PR links, issue numbers, or author credits, because the changelog generator adds them.
- **Altitude:** No file names, function names, or class names unless the user types them. Implementation details belong in the PR description.
- **Sound like a person:** Write in plain, full sentences. Avoid "seamlessly", "robust", "enhanced", "various improvements", and "minor fixes". If you can't say concretely what changed for the user, the change may not need a changeset.

## File format and naming

Name the file after the change in short kebab-case, like the others in `.changeset/` (`lockfile-affected-stories.md`, `foreign-key-indexes.md`), not the random name `pnpm changeset` generates. Write it by hand or run `pnpm changeset` and rename it.

```md
---
"@open-visual-regression/cli": patch
"@ovr/storybook-compat": patch
---

`--only-affected` no longer captures every story in some Rspack and Webpack Storybooks for changes that only affect a few stories.
```

Package names in the frontmatter must be quoted and must match each `package.json` `name`. After writing it, run `pnpm changeset status` to confirm it parses and lists the bumps you expect.

## Process

1. Look at the full branch diff against `main` and decide whether anything in it is user-facing. If not, stop. No changeset is needed.
2. Work out which packages changed and which apps the change ships in, then pick each package's bump.
3. Write the summary from the user's side, following the rules above, and check it against the examples.
4. If the PR's scope changes during review, update the changeset to match. It's the release note, so it has to describe what actually merged.

## Good examples

These are from this repo's changelogs, and the last one is trimmed to fit the 30-word limit.

```md
Captures load lazy images and iframes up front, so images below the viewport are no longer missing or half-loaded in full-page screenshots.
```

```md
Small builds no longer wait for every snapshot of a large build queued before them. Set `OVR_CAPTURE_QUEUE_POLICY=fifo` to keep the previous order.
```

```md
External hosts aren't blocked by default. Set `blockExternalRequests` in `ovr.config.ts` to block them. Stories that load images or fonts from another host may change once.
```

## Bad examples

```md
Fixed bug in capture.
```

This doesn't say which bug, what the user saw, or what's different now.

```md
Refactored `waitForStable()` in `packages/capture-browser/src/page.ts` to use a `MutationObserver` instead of `networkidle`, and added tests.
```

This describes the code instead of the effect, and names files and functions users never see. The good version is "Captures wait for the DOM to stop changing…, so a story that renders in waves is no longer captured halfway."

```md
This PR introduces a robust new metrics system that seamlessly enhances observability. (#441)
```

This uses PR voice and stock AI phrasing, includes a PR reference the generator already adds, and never says how to turn the feature on.
