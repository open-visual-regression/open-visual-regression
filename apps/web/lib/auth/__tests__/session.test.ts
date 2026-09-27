import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { vi } from "vitest";

import { REQUEST_PATH_HEADER } from "@/lib/utils/redirects";
import { describe, expect, it } from "@/test-utils";

import { auth } from "../auth";
import { requireSession } from "../session";

vi.mock("next/headers");
vi.mock("next/navigation");
vi.mock("../auth");

describe("requireSession", () => {
  it("should return the session when signed in", async () => {
    const session = { user: { id: "user-1" } };
    vi.mocked(auth.api.getSession).mockResolvedValue(session as never);

    expect(await requireSession()).toBe(session);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("should redirect to login with a callback to the requested page", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
    vi.mocked(headers).mockResolvedValue(
      new Headers({ [REQUEST_PATH_HEADER]: "/projects/1/builds/2?statuses=approved" }),
    );

    await requireSession();

    expect(redirect).toHaveBeenCalledWith(
      "/login?callback_url=%2Fprojects%2F1%2Fbuilds%2F2%3Fstatuses%3Dapproved",
    );
  });

  it("should redirect to login when the requested page is unknown", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
    vi.mocked(headers).mockResolvedValue(new Headers());

    await requireSession();

    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
