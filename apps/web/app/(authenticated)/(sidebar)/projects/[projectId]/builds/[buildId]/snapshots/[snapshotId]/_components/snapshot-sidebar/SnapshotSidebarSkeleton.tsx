"use client";

import { Tabs, TabsContent, TabsTrigger } from "@ovr/ui/components/tabs";

import { useSnapshotPreferences } from "@/lib/providers/SnapshotPreferencesProvider";

import { SnapshotReviewsSkeleton } from "./SnapshotReviews";
import { SnapshotSidebar } from "./SnapshotSidebar";
import { SnapshotSidebarTabsList } from "./SnapshotSidebarTabsList";

export const SnapshotSidebarSkeleton = () => {
  const { sidebarOpen } = useSnapshotPreferences();

  return (
    <SnapshotSidebar collapsed={!sidebarOpen}>
      <Tabs defaultValue="reviews" className="gap-0">
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
      </Tabs>
    </SnapshotSidebar>
  );
};
