import { eq } from "drizzle-orm";

import { dbClient } from "../client";
import { db } from "../db";
import { gitIntegrations } from "../schema";
import { describe, expect, test } from "./fixtures";

const accessTokenValues = (projectId: string) => ({
  projectId,
  provider: "github" as const,
  repoIdentifier: "acme/web",
  encryptedToken: "encrypted",
  checkContext: "ovr/visual-review",
});

describe("gitIntegrations", () => {
  describe("upsertAccessToken", () => {
    test("should store the integration as access token auth", async ({ project }) => {
      const integration = await dbClient.gitIntegrations.upsertAccessToken(
        accessTokenValues(project.id),
      );

      expect(integration).toMatchObject({
        credentialType: "access_token",
        encryptedToken: "encrypted",
        connectionId: null,
        externalRepoId: null,
      });
    });

    test("should clear the connection when switching to an access token", async ({ project }) => {
      await db.insert(gitIntegrations).values({
        projectId: project.id,
        provider: "github",
        repoIdentifier: "acme/web",
        credentialType: "connection",
        connectionId: "42",
        externalRepoId: "7",
        checkContext: "ovr/visual-review",
      });

      const integration = await dbClient.gitIntegrations.upsertAccessToken(
        accessTokenValues(project.id),
      );

      expect(integration).toMatchObject({
        credentialType: "access_token",
        encryptedToken: "encrypted",
        connectionId: null,
        externalRepoId: null,
      });
    });
  });

  describe("upsertConnection", () => {
    test("should replace an access token with a connection", async ({ project }) => {
      await dbClient.gitIntegrations.upsertAccessToken(accessTokenValues(project.id));

      const integration = await dbClient.gitIntegrations.upsertConnection({
        projectId: project.id,
        provider: "github",
        repoIdentifier: "acme/web",
        connectionId: "42",
        externalRepoId: "7",
        checkContext: "ovr/visual-review",
      });

      expect(integration).toMatchObject({
        credentialType: "connection",
        encryptedToken: null,
        connectionId: "42",
        externalRepoId: "7",
      });
    });
  });

  describe("updateFields", () => {
    test("should not touch a connection integration", async ({ project }) => {
      await dbClient.gitIntegrations.upsertConnection({
        projectId: project.id,
        provider: "github",
        repoIdentifier: "acme/web",
        connectionId: "42",
        externalRepoId: "7",
        checkContext: "ovr/visual-review",
      });

      const updated = await dbClient.gitIntegrations.updateFields({
        projectId: project.id,
        provider: "github",
        repoIdentifier: "acme/other",
        checkContext: "ovr/visual-review",
      });

      expect(updated).toBeUndefined();
    });
  });

  describe("credentials check", () => {
    test("should reject an access token integration without a token", async ({ project }) => {
      await expect(
        db.insert(gitIntegrations).values({
          ...accessTokenValues(project.id),
          encryptedToken: null,
        }),
      ).rejects.toThrow();
    });

    test("should reject a connection integration without a connection", async ({ project }) => {
      await expect(
        db.insert(gitIntegrations).values({
          ...accessTokenValues(project.id),
          credentialType: "connection",
          encryptedToken: null,
          externalRepoId: "7",
        }),
      ).rejects.toThrow();
    });

    test("should reject a connection integration that also stores a token", async ({ project }) => {
      await expect(
        db.insert(gitIntegrations).values({
          ...accessTokenValues(project.id),
          credentialType: "connection",
          connectionId: "42",
          externalRepoId: "7",
        }),
      ).rejects.toThrow();
    });

    test("should accept a connection integration with its connection and repository", async ({
      project,
    }) => {
      await db.insert(gitIntegrations).values({
        ...accessTokenValues(project.id),
        credentialType: "connection",
        encryptedToken: null,
        connectionId: "42",
        externalRepoId: "7",
      });

      const [stored] = await db
        .select()
        .from(gitIntegrations)
        .where(eq(gitIntegrations.projectId, project.id));
      expect(stored).toMatchObject({ connectionId: "42", externalRepoId: "7" });
    });
  });
});
