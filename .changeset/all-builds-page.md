---
"@ovr/web": minor
---

Add an all-builds page at `/builds`.

It lists every build the caller can read, newest first, in the same infinite
scrolling table the project page uses, and each row links to that build under
its own project. The list, its rows and the projects sidebar now live in
`lib/components`, shared by both pages; filters and search stay project-scoped
for now.
