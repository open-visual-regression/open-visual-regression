---
"@ovr/web": minor
---

OVR can sign people in from the identity an SSO proxy forwards, so deployments behind Okta or another identity provider no longer ask for a second password. Set `OVR_AUTH_MODE=trusted-proxy` (Helm: `auth.mode`) to turn it on. Existing users keep their accounts, matched by email. Roles come from the identity provider's groups and update on every request. See the SSO page in the self-hosting docs.
