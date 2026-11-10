import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotPreferencesProvider, useSnapshotPreferences } from "../snapshot-preferences";
import { setSnapshotPreferenceCookie } from "../snapshotPreferencesCookie";

const Consumer = () => {
  const { sidebarOpen, showDiff, setSidebarOpen, setShowDiff } = useSnapshotPreferences();

  return (
    <>
      <output aria-label="sidebar">{String(sidebarOpen)}</output>
      <output aria-label="diff">{String(showDiff)}</output>
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>toggle sidebar</button>
      <button onClick={() => setShowDiff(!showDiff)}>toggle diff</button>
    </>
  );
};

const renderProvider = () =>
  render(
    <SnapshotPreferencesProvider initialPreferences={{ sidebarOpen: false, showDiff: true }}>
      <Consumer />
    </SnapshotPreferencesProvider>,
  );

describe("SnapshotPreferencesProvider", () => {
  it("should start from the stored cookies", () => {
    setSnapshotPreferenceCookie("sidebarOpen", true);
    setSnapshotPreferenceCookie("showDiff", false);

    renderProvider();

    expect(screen.getByLabelText("sidebar")).toHaveTextContent("true");
    expect(screen.getByLabelText("diff")).toHaveTextContent("false");
  });

  it("should keep the preferences for the next mount", async ({ user }) => {
    const { unmount } = renderProvider();

    await user.click(screen.getByRole("button", { name: "toggle sidebar" }));
    await user.click(screen.getByRole("button", { name: "toggle diff" }));
    unmount();
    renderProvider();

    expect(screen.getByLabelText("sidebar")).toHaveTextContent("true");
    expect(screen.getByLabelText("diff")).toHaveTextContent("false");
  });

  it("should throw when used outside the provider", () => {
    expect(() => render(<Consumer />)).toThrow(/within a SnapshotPreferencesProvider/);
  });
});
