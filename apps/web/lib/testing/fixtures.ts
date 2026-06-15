import { test as vitest, vi } from "vitest";
import { headers } from "next/headers";
import { convertSetCookieToCookie } from "better-auth/test";

import { mocks } from "@ovr/mocks";
import { auth } from "@/lib/auth/auth";
import type { User } from "@/lib/auth/auth";

export { expect, describe } from "vitest";

const TEST_PASSWORD = "securepass123";

export const test = vitest.extend<{
  admin: User;
  user: User;
}>({
  // eslint-disable-next-line no-empty-pattern
  admin: async ({}, use) => {
    const { name, email } = mocks.user.generateAuthUser();
    const { user } = await auth.api.createUser({
      body: { name, email, password: TEST_PASSWORD, role: "admin" },
    });
    const org = mocks.organization.generateOrganization();
    await auth.api.createOrganization({
      body: { name: org.name, slug: org.slug, userId: user.id },
    });
    const response = await auth.api.signInEmail({
      body: { email, password: TEST_PASSWORD },
      asResponse: true,
    });
    vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(response.headers));
    await use(user);
    vi.mocked(headers).mockResolvedValue(new Headers());
  },

  // eslint-disable-next-line no-empty-pattern
  user: async ({}, use) => {
    const { name, email } = mocks.user.generateAuthUser();
    const { user } = await auth.api.signUpEmail({ body: { name, email, password: TEST_PASSWORD } });
    const org = mocks.organization.generateOrganization();
    await auth.api.createOrganization({
      body: { name: org.name, slug: org.slug, userId: user.id },
    });
    const response = await auth.api.signInEmail({
      body: { email, password: TEST_PASSWORD },
      asResponse: true,
    });
    vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(response.headers));
    await use(user);
    vi.mocked(headers).mockResolvedValue(new Headers());
  },
});
