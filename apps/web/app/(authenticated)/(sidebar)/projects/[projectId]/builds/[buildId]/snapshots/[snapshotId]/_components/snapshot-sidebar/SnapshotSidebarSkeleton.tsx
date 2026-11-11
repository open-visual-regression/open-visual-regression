"use client";

import { TabsContent, TabsTrigger } from "@ovr/ui/components/tabs";

import { useSnapshotPreferences } from "@/lib/providers/SnapshotPreferencesProvider";

import { SnapshotHistoryListSkeleton } from "./SnapshotHistoryList";
import { SnapshotLogsSkeleton } from "./SnapshotLogs";
import { SnapshotReviewsSkeleton } from "./SnapshotReviews";
import { SnapshotSidebar } from "./SnapshotSidebar";
import { SnapshotSidebarTabs } from "./SnapshotSidebarTabs";
import { SnapshotSidebarTabsList } from "./SnapshotSidebarTabsList";

export const SnapshotSidebarSkeleton = () => {
  const { sidebarOpen } = useSnapshotPreferences();

  return (
    <SnapshotSidebar collapsed={!sidebarOpen}>
      <SnapshotSidebarTabs>
        <SnapshotSidebarTabsList
          historyTrigger={
            <TabsTrigger className="px-5" value="history">
              History
            </TabsTrigger>
          }
        />
        <TabsContent value="reviews" className="px-3 pt-3">
          <SnapshotReviewsSkeleton />
        </TabsContent>
        <TabsContent value="logs" className="px-3 pt-3">
          <SnapshotLogsSkeleton />
        </TabsContent>
        <TabsContent value="history" className="px-3 pt-3 pb-3">
          <SnapshotHistoryListSkeleton />
        </TabsContent>
      </SnapshotSidebarTabs>
    </SnapshotSidebar>
  );
};
