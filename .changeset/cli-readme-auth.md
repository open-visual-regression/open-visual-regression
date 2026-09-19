---
"@open-visual-regression/cli": patch
---

Correct the README's documented authentication requirements.

It claimed every command takes a project-scoped API key, which has not been
true since `builds list` and `builds get` landed — those read builds through a
personal access token and reject a project API key outright. The README now
describes both token kinds and which commands accept each, matching the
authentication reference page in the docs.
