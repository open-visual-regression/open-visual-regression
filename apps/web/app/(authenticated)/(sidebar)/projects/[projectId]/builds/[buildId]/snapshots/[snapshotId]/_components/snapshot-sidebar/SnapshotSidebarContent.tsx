import type { ListReviewsOutputSchema } from "@ovr/api/contracts/diffs";
import { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@ovr/ui/components/tabs";

import { getCachedSession } from "@/lib/auth/session";

import { SnapshotReviews } from "./SnapshotReviews";
import { SnapshotSidebarHistoryContent } from "./SnapshotSidebarHistoryContent";
import { SnapshotSidebarLogsContent } from "./SnapshotSidebarLogsContent";

type SnapshotSidebarContentProps = {
  projectId: string;
  snapshot: SnapshotSchema;
  diffId: string | null;
  reviews: ListReviewsOutputSchema;
};

export const SnapshotSidebarContent = async ({
  projectId,
  snapshot,
  diffId,
  reviews,
}: SnapshotSidebarContentProps) => {
  const session = await getCachedSession();

  return (
    <Tabs defaultValue="reviews" className="gap-0">
      <TabsList variant="line">
        <TabsTrigger className="px-5" value="reviews">
          Reviews
        </TabsTrigger>
        <TabsTrigger className="px-5" value="logs">
          Logs
        </TabsTrigger>
        <TabsTrigger className="px-5" value="history">
          History
        </TabsTrigger>
      </TabsList>
      <TabsContent value="reviews" className="px-3 pt-3">
        <SnapshotReviews
          reviews={reviews.reviews}
          requiredReviewerCount={reviews.requiredReviewerCount}
          diffId={diffId}
          currentUserId={session?.user.id}
          role={session?.user.role}
        />
      </TabsContent>
      <TabsContent value="logs" className="pt-3">
        <SnapshotSidebarLogsContent snapshot={snapshot} />
      </TabsContent>
      <TabsContent value="history" className="pt-3">
        <SnapshotSidebarHistoryContent projectId={projectId} snapshotId={snapshot.id} />
      </TabsContent>
    </Tabs>
  );
};
