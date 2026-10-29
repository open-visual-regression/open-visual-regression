import { http, HttpResponse } from "msw";
import { useRouter } from "next/navigation";
import { vi } from "vitest";

import type { GitIntegrationSchema } from "@ovr/api/contracts/gitIntegrations";
import type { GitProviderSummarySchema } from "@ovr/api/contracts/gitProviders";
import { mocks } from "@ovr/mocks";

import { serverClient } from "@/lib/router";
import { server } from "@/lib/testing/server";
import { describe, expect, it, screen, waitFor } from "@/test-utils";

import { GitIntegrationForm } from "../GitIntegrationForm";
import { renderWithQueryClient } from "./renderWithQueryClient";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockUpsert = vi.mocked(serverClient.gitIntegrations.upsert);
const mockRefresh = vi.mocked(useRouter)().refresh;

const PROJECT_ID = "project-id";

const ACCESS_TOKEN_ONLY = mocks.gitProvider.generateProviderSummary({
  credentialTypes: ["access_token"],
});
const WITH_CONNECTIONS = mocks.gitProvider.generateProviderSummary();

const TOKEN_INTEGRATION = mocks.gitIntegration.generateGitIntegration({
  repoIdentifier: "acme/web",
});
const CONNECTION_INTEGRATION = mocks.gitIntegration.generateGitIntegration({
  repoIdentifier: "acme/api",
  credentialType: "connection",
  connectionId: "42",
  externalRepoId: "8",
});

const renderForm = (
  integration: GitIntegrationSchema | null,
  provider: GitProviderSummarySchema = ACCESS_TOKEN_ONLY,
) =>
  renderWithQueryClient(
    <GitIntegrationForm projectId={PROJECT_ID} integration={integration} providers={[provider]} />,
  );

const serveRepositories = () =>
  server.use(
    http.post("*/api/rpc/gitProviders/searchRepositories", () =>
      HttpResponse.json({
        json: {
          status: "ok",
          repositories: [
            mocks.gitProvider.generateRepository({ id: "8", fullName: "acme/api" }),
            mocks.gitProvider.generateRepository({ id: "7", fullName: "acme/web" }),
          ],
          nextCursor: null,
        },
      }),
    ),
  );

describe("GitIntegrationForm", () => {
  describe("with an access token", () => {
    it("should only offer access tokens when the provider has no connections", () => {
      renderForm(null);

      expect(screen.queryByLabelText(/authentication/i)).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText("owner/repo")).toBeVisible();
      expect(screen.getByLabelText(/access token/i)).toBeVisible();
    });

    it("should render the integration's current values", () => {
      renderForm(TOKEN_INTEGRATION);

      expect(screen.getByPlaceholderText("owner/repo")).toHaveValue("acme/web");
      expect(screen.getByLabelText(/access token/i)).toHaveValue("");
    });

    it("should show a validation error when repository is blank", async ({ user }) => {
      renderForm(null);

      await user.type(screen.getByLabelText(/access token/i), "a-token");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      expect(await screen.findByText("you must enter a repository")).toBeVisible();
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("should submit the integration", async ({ user }) => {
      mockUpsert.mockResolvedValue([null, TOKEN_INTEGRATION]);
      renderForm(null);

      await user.type(screen.getByPlaceholderText("owner/repo"), "acme/other");
      await user.type(screen.getByLabelText(/access token/i), "a-token");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(mockUpsert).toHaveBeenCalledWith({
          projectId: PROJECT_ID,
          provider: "github",
          credential: { type: "access_token", repoIdentifier: "acme/other", token: "a-token" },
        }),
      );
      expect(await screen.findByText("git integration saved")).toBeVisible();
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("should update an existing integration without re-entering the token", async ({ user }) => {
      mockUpsert.mockResolvedValue([null, TOKEN_INTEGRATION]);
      renderForm(TOKEN_INTEGRATION);

      await user.clear(screen.getByPlaceholderText("owner/repo"));
      await user.type(screen.getByPlaceholderText("owner/repo"), "acme/renamed");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            credential: { type: "access_token", repoIdentifier: "acme/renamed", token: undefined },
          }),
        ),
      );
    });
  });

  describe("with a connection", () => {
    it("should default to the provider's connection and link the chosen repository", async ({
      user,
    }) => {
      serveRepositories();
      mockUpsert.mockResolvedValue([null, CONNECTION_INTEGRATION]);
      renderForm(null, WITH_CONNECTIONS);

      expect(screen.getByRole("combobox", { name: /authentication/i })).toHaveTextContent(
        "github app",
      );
      expect(screen.queryByLabelText(/access token/i)).not.toBeInTheDocument();

      await user.click(screen.getByRole("combobox", { name: /repository/i }));
      await user.click(await screen.findByRole("option", { name: "acme/web" }));
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(mockUpsert).toHaveBeenCalledWith({
          projectId: PROJECT_ID,
          provider: "github",
          credential: { type: "connection", connectionId: "42", repositoryId: "7" },
        }),
      );
    });

    it("should require a repository", async ({ user }) => {
      renderForm(null, WITH_CONNECTIONS);

      await user.click(screen.getByRole("button", { name: /^save$/i }));

      expect(await screen.findByText("you must choose a repository")).toBeVisible();
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("should show the linked repository", () => {
      renderForm(CONNECTION_INTEGRATION, WITH_CONNECTIONS);

      expect(screen.getByRole("combobox", { name: /repository/i })).toHaveValue("acme/api");
    });

    it("should keep showing a connection the instance no longer offers", () => {
      renderForm(CONNECTION_INTEGRATION, ACCESS_TOKEN_ONLY);

      expect(screen.getByRole("combobox", { name: /authentication/i })).toHaveTextContent(
        "github app",
      );
    });

    it("should ask for a token when switching a connection integration to an access token", async ({
      user,
    }) => {
      renderForm(CONNECTION_INTEGRATION, WITH_CONNECTIONS);

      await user.click(screen.getByRole("combobox", { name: /authentication/i }));
      await user.click(await screen.findByRole("option", { name: "access token" }));
      await user.type(screen.getByPlaceholderText("owner/repo"), "acme/web");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      expect(await screen.findByText("you must enter an access token")).toBeVisible();
      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });
});
