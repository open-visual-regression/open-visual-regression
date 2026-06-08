import { test, vi } from "vitest";
import { headers } from "next/headers";
import { convertSetCookieToCookie } from "better-auth/test";

import { mocks } from "@ovr/mocks";
import { auth } from "@/lib/auth/auth";
import type { User } from "@/lib/auth/auth";

export { expect, describe } from "vitest";

const TEST_PASSWORD = "securepass123";

export const it = test.extend<{
  admin: { user: User };
  user: { user: User };
}>({
  admin: async (_ctx, use) => {
    const { name, email } = mocks.user.generateUser();
    const { user } = await auth.api.createUser({
      body: { name, email, password: TEST_PASSWORD, role: "admin" },
    });
    const response = await auth.api.signInEmail({
      body: { email, password: TEST_PASSWORD },
      asResponse: true,
    });
    vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(response.headers));
    await use({ user: user as User });
    vi.mocked(headers).mockResolvedValue(new Headers());
  },

  user: async (_ctx, use) => {
    const { name, email } = mocks.user.generateUser();
    const { user } = await auth.api.signUpEmail({ body: { name, email, password: TEST_PASSWORD } });
    const response = await auth.api.signInEmail({
      body: { email, password: TEST_PASSWORD },
      asResponse: true,
    });
    vi.mocked(headers).mockResolvedValue(convertSetCookieToCookie(response.headers));
    await use({ user });
    vi.mocked(headers).mockResolvedValue(new Headers());
  },
});
