import { randomUUID } from "node:crypto";

import { convertSetCookieToCookie } from "better-auth/test";
import { exportJWK, exportSPKI, generateKeyPair, SignJWT, type JWTPayload } from "jose";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { headers } from "next/headers";
import { test as vitest, vi } from "vitest";

import { metricsFixture, type TestMetrics } from "@ovr/metrics/testing";
import { mocks } from "@ovr/mocks";

import { auth } from "@/lib/auth/auth";
import type { User } from "@/lib/auth/auth";

type Organization = NonNullable<Awaited<ReturnType<typeof auth.api.createOrganization>>>;

export { expect, describe } from "vitest";

const TEST_PASSWORD = "securepass123";

type QueuedJob = { remove: () => Promise<void> };

const IDENTITY_PROVIDER_ALGORITHM = "ES256";

export type IdentityProvider = {
  issuer: string;
  jwksUrl: string;
  keyUrl: string;
  signToken: (
    claims?: JWTPayload,
    options?: { expiresIn?: string; header?: Record<string, unknown> },
  ) => Promise<string>;
};

export const test = vitest.extend<{
  admin: User;
  reviewer: User;
  viewer: User;
  organization: Organization;
  identityProvider: IdentityProvider;
  metrics: TestMetrics;
  trackJob: <T extends QueuedJob>(job: T) => T;
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
  reviewer: async ({}, use) => {
    const { name, email } = mocks.user.generateAuthUser();
    const { user } = await auth.api.createUser({
      body: { name, email, password: TEST_PASSWORD, role: "reviewer" },
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
  viewer: async ({}, use) => {
    const { name, email } = mocks.user.generateAuthUser();
    const { user } = await auth.api.createUser({
      body: { name, email, password: TEST_PASSWORD, role: "viewer" },
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
  organization: async ({}, use) => {
    const { name, email } = mocks.user.generateAuthUser();
    const { user } = await auth.api.createUser({
      body: { name, email, password: TEST_PASSWORD, role: "admin" },
    });
    const org = mocks.organization.generateOrganization();
    const organization = await auth.api.createOrganization({
      body: { name: org.name, slug: org.slug, userId: user.id },
    });
    await use(organization!);
  },

  // eslint-disable-next-line no-empty-pattern
  identityProvider: async ({}, use) => {
    const issuer = `https://idp-${randomUUID()}.example.com`;
    const kid = randomUUID();
    const { publicKey, privateKey } = await generateKeyPair(IDENTITY_PROVIDER_ALGORITHM, {
      extractable: true,
    });
    const jwk = { ...(await exportJWK(publicKey)), kid, alg: IDENTITY_PROVIDER_ALGORITHM };
    const pem = await exportSPKI(publicKey);
    const server = setupServer(
      http.get(`${issuer}/keys`, () => HttpResponse.json({ keys: [jwk] })),
      http.get(`${issuer}/keys/:kid`, ({ params }) =>
        params.kid === kid ? HttpResponse.text(pem) : new HttpResponse(null, { status: 404 }),
      ),
    );
    server.listen({ onUnhandledRequest: "error" });
    await use({
      issuer,
      jwksUrl: `${issuer}/keys`,
      keyUrl: `${issuer}/keys/{kid}`,
      signToken: (claims = {}, { expiresIn = "5m", header = {} } = {}) =>
        new SignJWT({
          iss: issuer,
          sub: "jane",
          email: "jane@example.com",
          name: "Jane Doe",
          ...claims,
        })
          .setProtectedHeader({ alg: IDENTITY_PROVIDER_ALGORITHM, kid, ...header })
          .setIssuedAt()
          .setExpirationTime(expiresIn)
          .sign(privateKey),
    });
    server.close();
  },

  metrics: metricsFixture,

  // eslint-disable-next-line no-empty-pattern
  trackJob: async ({}, use) => {
    const jobs: QueuedJob[] = [];

    await use((job) => {
      jobs.push(job);
      return job;
    });

    await Promise.all(jobs.map((job) => job.remove()));
  },
});
