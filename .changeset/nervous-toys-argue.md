---
"@open-visual-regression/cli": minor
"@ovr/worker": minor
---

Require Storybook 8.5 or newer, and reject older builds up front.

The capture step waits for the preview's `storyFinished` event to know a story's
play function has finished. That event was added in Storybook 8.5, so on 8.4 and
older every story sat until the render timeout rather than being captured — the
CLI accepted the build and it failed later, in the worker. Storybook 7 was also
missing `__STORYBOOK_PREVIEW__.storeInitializationPromise`, which the extract
step waits on to read `ovr` story parameters.

The supported floor is now 8.5. `ovr snapshot storybook` reports an unsupported
build before uploading it, and the worker refuses one before spending a capture
job per story. The version is read from the `project.json` that `storybook build`
writes; a Storybook 7 build is still recognised from its `index.json` `v4`
manifest when that file is absent.
