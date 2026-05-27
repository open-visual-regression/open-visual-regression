import { auth } from "@/lib/auth";
import { vi, describe, it, expect } from "vitest";
import { mocks } from "@ovr/mocks";
import { createAdminAndOrg, type SetupInput } from "../setup";

vi.mock("@/lib/auth");

const mockSignUpEmail = vi.mocked(auth.api.signUpEmail);
const mockCreateOrganization = vi.mocked(auth.api.createOrganization);

const baseInput: SetupInput = {
  orgName: "Acme Corp",
  name: "Jane Doe",
  email: "jane@example.com",
  password: "securepass123",
};

describe("createAdminAndOrg", () => {
  it("should return ok on success", async () => {
    mockSignUpEmail.mockResolvedValue({
      token: "tok123",
      user: mocks.user.generateUser(),
    });
    mockCreateOrganization.mockResolvedValue({
      ...mocks.organization.generateOrganization(),
      members: [],
    });

    const result = await createAdminAndOrg(baseInput);

    expect(result).toEqual({ status: "ok", data: null });
  });

  it("should pass user id to createOrganization body", async () => {
    const user = mocks.user.generateUser();
    mockSignUpEmail.mockResolvedValue({ token: "abc123", user });
    mockCreateOrganization.mockResolvedValue({
      ...mocks.organization.generateOrganization(),
      members: [],
    });

    await createAdminAndOrg(baseInput);

    expect(mockCreateOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ userId: user.id }),
      }),
    );
  });

  it("should sanitize org slug — strips special chars and collapses spaces", async () => {
    mockSignUpEmail.mockResolvedValue({
      token: "tok123",
      user: mocks.user.generateUser(),
    });
    mockCreateOrganization.mockResolvedValue({
      ...mocks.organization.generateOrganization(),
      members: [],
    });

    await createAdminAndOrg({ ...baseInput, orgName: "Tom's Org!" });

    expect(mockCreateOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ slug: "toms-org" }),
      }),
    );
  });

  it("should return error when signUpEmail throws", async () => {
    mockSignUpEmail.mockRejectedValue(new Error("email already in use"));

    const result = await createAdminAndOrg(baseInput);

    expect(result).toEqual({ status: "error", error: "email already in use" });
  });

  it("should return error when createOrganization throws", async () => {
    mockSignUpEmail.mockResolvedValue({
      token: "tok123",
      user: mocks.user.generateUser(),
    });
    mockCreateOrganization.mockRejectedValue(new Error("org creation failed"));

    const result = await createAdminAndOrg(baseInput);

    expect(result).toEqual({ status: "error", error: "org creation failed" });
  });

  it("should return generic error for non-Error throws", async () => {
    mockSignUpEmail.mockRejectedValue("something weird");

    const result = await createAdminAndOrg(baseInput);

    expect(result).toEqual({ status: "error", error: "setup failed" });
  });
});
