# docs

Source for [docs.openvisualregression.com](https://docs.openvisualregression.com), built with [Mintlify](https://mintlify.com).

## Local development

```sh
pnpm --filter @ovr/docs dev
```

This runs `npx mint@latest dev` and serves the site at `http://localhost:3000`, always resolving the latest Mintlify CLI rather than a pinned version.

## Hosting

This site is hosted on Mintlify's own infrastructure, not built by this repo's CI. That requires a one-time manual setup that hasn't been done yet:

1. Install the Mintlify GitHub App on the `open-visual-regression` org and connect this repository, setting the docs directory to `apps/docs`.
2. In the Mintlify dashboard, add `docs.openvisualregression.com` as a custom domain.
3. Create a CNAME DNS record for `docs.openvisualregression.com` pointing at the target Mintlify's dashboard provides.

Once connected, pushes to `main` deploy automatically and pull requests get a preview link commented on them.
