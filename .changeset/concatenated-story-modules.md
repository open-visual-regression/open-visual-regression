---
"@open-visual-regression/cli": patch
"@ovr/storybook-compat": patch
---

`--only-affected` no longer captures every story when a changed file was concatenated into a story file by Rspack or Webpack scope hoisting. Such a file is listed with only the stories glob as its importer, so it looked like an entry of the Storybook preview. It is now traced to the story file it was concatenated into.
