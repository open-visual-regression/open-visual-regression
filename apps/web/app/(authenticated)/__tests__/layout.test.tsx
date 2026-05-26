import { vi, describe, it, expect } from "vitest";
import { mocks } from "@ovr/mocks";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { render } from "@/test-utils";
import AppLayout from "../layout";

vi.mock("@/lib/auth");
vi.mock("next/navigation");
vi.mock("next/headers");

const mockGetSession = vi.mocked(auth.api.getSession);

const props = {
  navigation: <nav />,
  sidebar: <aside />,
  children: <div>content</div>,
};

describe("AppLayout", () => {
  it("should redirect to /login when there is no session", async () => {
    mockGetSession.mockResolvedValue(null);
    await AppLayout(props);
    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/login");
  });

  it("should render children when session is valid", async () => {
    mockGetSession.mockResolvedValue({
      session: mocks.session.generateSession(),
      user: mocks.user.generateUser(),
    });
    const jsx = await AppLayout(props);
    const { getByText } = render(jsx);
    expect(getByText("content")).toBeVisible();
  });
});
