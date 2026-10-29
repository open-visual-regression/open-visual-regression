import { http, HttpResponse } from "msw";
import { useForm } from "react-hook-form";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { server } from "@/lib/testing/server";
import { describe, expect, it, screen, waitFor } from "@/test-utils";

import { ConnectionRepositoryField } from "../ConnectionRepositoryField";
import type { GitIntegrationFormValues } from "../schema";
import { renderWithQueryClient } from "./renderWithQueryClient";

const Harness = () => {
  const { control } = useForm<GitIntegrationFormValues>({
    defaultValues: {
      provider: "github",
      credentialType: "connection",
      repoIdentifier: "",
      token: "",
      repository: null,
    },
  });

  return (
    <ConnectionRepositoryField
      control={control}
      provider={mocks.gitProvider.generateProviderSummary()}
      error={undefined}
    />
  );
};

const serveSearch = (respond: (query: string) => unknown) => {
  const search = vi.fn<(query: string) => void>();
  server.use(
    http.post("*/api/rpc/gitProviders/searchRepositories", async ({ request }) => {
      const { json } = (await request.json()) as { json: { query: string } };
      search(json.query);
      return HttpResponse.json({ json: respond(json.query) });
    }),
  );
  return search;
};

describe("ConnectionRepositoryField", () => {
  it("should not search until the picker is opened", async ({ user }) => {
    const search = serveSearch(() => ({ status: "ok", repositories: [], nextCursor: null }));
    renderWithQueryClient(<Harness />);

    expect(search).not.toHaveBeenCalled();

    await user.click(screen.getByRole("combobox", { name: /repository/i }));

    await waitFor(() => expect(search).toHaveBeenCalledWith(""));
  });

  it("should search as the admin types", async ({ user }) => {
    const search = serveSearch((query) => ({
      status: "ok",
      repositories: query === "web" ? [mocks.gitProvider.generateRepository()] : [],
      nextCursor: null,
    }));
    renderWithQueryClient(<Harness />);

    await user.type(screen.getByRole("combobox", { name: /repository/i }), "web");

    expect(await screen.findByRole("option", { name: "acme/web" })).toBeVisible();
    expect(search).toHaveBeenLastCalledWith("web");
  });

  it("should say when nothing matches", async ({ user }) => {
    serveSearch(() => ({ status: "ok", repositories: [], nextCursor: null }));
    renderWithQueryClient(<Harness />);

    await user.click(screen.getByRole("combobox", { name: /repository/i }));

    expect(await screen.findByText("no repositories match")).toBeVisible();
  });

  it("should explain why repositories can't be searched", async ({ user }) => {
    serveSearch(() => ({ status: "error", error: "github responded with 502" }));
    renderWithQueryClient(<Harness />);

    await user.click(screen.getByRole("combobox", { name: /repository/i }));

    expect(await screen.findByText("github responded with 502")).toBeVisible();
  });

  it("should link to the provider's connections", () => {
    renderWithQueryClient(<Harness />);

    expect(screen.getByText(/only repositories the github app can reach are listed/)).toBeVisible();
    expect(screen.getByRole("link", { name: /manage connections/i })).toHaveAttribute(
      "href",
      "/settings/integrations",
    );
  });
});
