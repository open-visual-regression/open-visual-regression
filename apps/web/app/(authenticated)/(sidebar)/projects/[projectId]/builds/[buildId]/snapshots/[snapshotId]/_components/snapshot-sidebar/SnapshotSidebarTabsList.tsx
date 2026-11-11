import { TabsList, TabsTrigger } from "@ovr/ui/components/tabs";

type SnapshotSidebarTabsListProps = {
  historyTrigger: React.ReactNode;
};

export const SnapshotSidebarTabsList = ({ historyTrigger }: SnapshotSidebarTabsListProps) => (
  <TabsList variant="line">
    <TabsTrigger className="px-5" value="reviews">
      Reviews
    </TabsTrigger>
    <TabsTrigger className="px-5" value="logs">
      Logs
    </TabsTrigger>
    {historyTrigger}
  </TabsList>
);
