import { faker } from "@faker-js/faker";
import type { UserSchema } from "@ovr/api/contracts/users";
import type { user } from "@ovr/db/schema";

type UserOverrides = {
  id?: string;
  name?: string;
  email?: string;
  role?: string | null;
  createdAt?: Date;
  status?: UserSchema["status"];
  invitationUrl?: string;
};

type User = typeof user.$inferSelect;

export const generateAuthUser = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  emailVerified: false,
  image: null,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  role: null,
  banned: null,
  banReason: null,
  banExpires: null,
  ...overrides,
});

export const generateUser = (overrides?: UserOverrides): UserSchema => {
  const base = {
    id: overrides?.id ?? faker.string.uuid(),
    name: overrides?.name ?? faker.person.fullName(),
    email: overrides?.email ?? faker.internet.email(),
    role: overrides?.role !== undefined ? overrides.role : "user",
    createdAt: overrides?.createdAt ?? faker.date.past(),
  };

  if (overrides?.status === "invited") {
    return {
      ...base,
      status: "invited",
      invitationUrl:
        overrides.invitationUrl ?? "https://example.com/invitations/test-invitation-id",
    };
  }

  return {
    ...base,
    status: "active",
  };
};
