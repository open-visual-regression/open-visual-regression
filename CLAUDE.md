# Agent instructions

## Every change gets smoke tested

Before you call a change done or open a PR, smoke test it in a realistic scenario: run the thing you changed the way a user or operator would and check it does the right thing. Follow the `smoke-testing` skill (`.claude/skills/smoke-testing/SKILL.md`) for how to do that for each kind of change.

- Typecheck, lint, unit tests, builds, and CI are required, but they are not smoke tests.
- Never open a PR whose description says it wasn't tested, or uses "N/A" for testing. If you can't smoke test a change after a real attempt, don't open the PR. Tell the user what's blocking you instead.
- Write PR descriptions with the `pr-description` skill.
