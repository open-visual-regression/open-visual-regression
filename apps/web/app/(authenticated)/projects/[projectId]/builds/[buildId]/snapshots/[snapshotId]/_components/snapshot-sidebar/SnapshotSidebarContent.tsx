import { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@ovr/ui/components/tabs";

import { SnapshotSidebarLogsContent } from "./SnapshotSidebarLogsContent";

type SnapshotSidebarContentProps = {
  snapshot: SnapshotSchema;
};

export const SnapshotSidebarContent = ({ snapshot }: SnapshotSidebarContentProps) => {
  return (
    <Tabs defaultValue="logs" className="gap-0">
      <TabsList variant="line">
        <TabsTrigger className="px-5" value="logs">
          Logs
        </TabsTrigger>
      </TabsList>
      <TabsContent value="logs" className="pt-3">
        <SnapshotSidebarLogsContent snapshot={snapshot} />
      </TabsContent>
    </Tabs>
  );
};
