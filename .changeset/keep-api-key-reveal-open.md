---
"@ovr/web": patch
---

Keep the new api key on screen after it is created.

Creating a key runs a server action, and Next.js re-renders the settings page
with its result. For the first key in a project that swaps the "no api keys yet"
empty state for the table — and the dialog lived inside that empty state, so it
unmounted along with it. The reveal flashed on screen and vanished before the key
could be copied, and because the key is only ever shown once it was lost for good.

The dialog now wraps the whole api keys section instead of sitting next to one
button, so both the header and empty state triggers open the same dialog and it
stays open until it is dismissed, whatever the list underneath it does.
