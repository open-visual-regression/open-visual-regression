import { TabsContent } from "@ovr/ui/components/tabs";
import { TabsTrigger } from "@ovr/ui/components/tabs";

import { type SnapshotSidebarTab } from "@/lib/preferences/snapshotPreferences";
import { SnapshotPreferencesProvider } from "@/lib/providers/SnapshotPreferencesProvider";
import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotSidebarTabs } from "../SnapshotSidebarTabs";
import { SnapshotSidebarTabsList } from "../SnapshotSidebarTabsList";

const Sidebar = ({ snapshotId }: { snapshotId: string }) => (
  <SnapshotSidebarTabs key={snapshotId}>
    <SnapshotSidebarTabsList
      historyTrigger={
        <TabsTrigger className="px-5" value="history">
          History
        </TabsTrigger>
      }
    />
    <TabsContent value="reviews">reviews for {snapshotId}</TabsContent>
    <TabsContent value="logs">logs for {snapshotId}</TabsContent>
    <TabsContent value="history">history for {snapshotId}</TabsContent>
  </SnapshotSidebarTabs>
);

const renderSidebar = (sidebarTab: SnapshotSidebarTab) => {
  const view = render(<Sidebar snapshotId="first" />, {
    wrapper: ({ children }) => (
      <SnapshotPreferencesProvider
        initialPreferences={{ sidebarOpen: true, sidebarTab, showDiff: true }}
      >
        {children}
      </SnapshotPreferencesProvider>
    ),
  });

  return {
    ...view,
    showSnapshot: (snapshotId: string) => view.rerender(<Sidebar snapshotId={snapshotId} />),
  };
};

describe("SnapshotSidebarTabs", () => {
  it("should open on the tab that was left selected", () => {
    renderSidebar("logs");

    expect(screen.getByRole("tab", { name: "Logs" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("logs for first")).toBeVisible();
  });

  it("should keep the selected tab when moving to another snapshot", async ({ user }) => {
    const view = renderSidebar("reviews");

    await user.click(screen.getByRole("tab", { name: "History" }));
    view.showSnapshot("second");

    expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("history for second")).toBeVisible();
  });
});
