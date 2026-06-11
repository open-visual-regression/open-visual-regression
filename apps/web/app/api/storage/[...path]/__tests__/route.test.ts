import { vi } from "vitest";

import { describe, expect, it } from "@/test-utils";
import { auth } from "@/lib/auth/auth";
import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";
import { mocks } from "@ovr/mocks";
import { GET } from "../route";

vi.mock("@/lib/auth/auth");
vi.mock("@ovr/db/client", () => ({
  dbClient: { projects: { getProject: vi.fn() } },
}));
vi.mock("@ovr/storage", () => ({
  storage: { getPresignedUrl: vi.fn() },
}));

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetProject = vi.mocked(dbClient.projects.getProject);
const mockGetPresignedUrl = vi.mocked(storage.getPresignedUrl);

const PROJECT_ID = "test-project-id";

const buildRequest = (path: string[]) =>
  GET(new Request(`http://localhost/api/storage/${path.join("/")}`), {
    params: Promise.resolve({ path }),
  });

describe("GET /api/storage/[...path]", () => {
  it("should return 401 when there is no session", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await buildRequest([PROJECT_ID, "snapshots", "foo.png"]);

    expect(response.status).toBe(401);
  });

  it("should return 403 when the project does not exist", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser(),
      session: mocks.session.generateSession({ activeOrganizationId: "test-org-id" }),
    });
    mockGetProject.mockResolvedValue(undefined);

    const response = await buildRequest([PROJECT_ID, "snapshots", "foo.png"]);

    expect(response.status).toBe(403);
    expect(mockGetProject).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      organizationId: "test-org-id",
    });
  });

  it("should redirect to a presigned url for an authorized request", async () => {
    mockGetSession.mockResolvedValue({
      user: mocks.user.generateUser(),
      session: mocks.session.generateSession({ activeOrganizationId: "test-org-id" }),
    });
    mockGetProject.mockResolvedValue({
      id: PROJECT_ID,
      name: "Test Project",
      description: null,
      diffThreshold: 0.1,
      gitMainBranch: "main",
      createdAt: new Date().toISOString(),
      creator: { id: "creator-id", name: "Creator", email: "creator@example.com" },
    });
    mockGetPresignedUrl.mockResolvedValue("https://storage.example.com/signed-url");

    const response = await buildRequest([PROJECT_ID, "snapshots", "foo.png"]);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://storage.example.com/signed-url");
    expect(mockGetPresignedUrl).toHaveBeenCalledWith(`${PROJECT_ID}/snapshots/foo.png`, 60);
  });
});
