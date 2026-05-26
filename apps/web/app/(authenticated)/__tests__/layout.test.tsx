import { vi, describe, it, expect } from "vitest";
import { getSessionCookie } from "better-auth/cookies";
import { redirect } from "next/navigation";
import { render } from "@/test-utils";
import AppLayout from "../layout";

vi.mock("better-auth/cookies");
vi.mock("next/navigation");
vi.mock("next/headers");

const mockGetSessionCookie = vi.mocked(getSessionCookie);

const props = {
  navigation: <nav />,
  sidebar: <aside />,
  children: <div>content</div>,
};

describe("AppLayout", () => {
  it("should redirect to /login when there is no session cookie", async () => {
    mockGetSessionCookie.mockReturnValue(null);
    await AppLayout(props);
    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/login");
  });

  it("should render children when session cookie is present", async () => {
    mockGetSessionCookie.mockReturnValue("session-token");
    const jsx = await AppLayout(props);
    const { getByText } = render(jsx);
    expect(getByText("content")).toBeVisible();
  });
});
