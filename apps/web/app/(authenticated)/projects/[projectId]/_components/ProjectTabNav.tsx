"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@ovr/ui/components/tabs";

type ProjectTabNavProps = {
  projectId: string;
};

const ProjectTabNav = ({ projectId }: ProjectTabNavProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") ?? "runs";

  return (
    <Tabs value={tab} onValueChange={(value) => router.push(`/projects/${projectId}?tab=${value}`)}>
      <TabsList variant="line">
        <TabsTrigger value="runs">All runs</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export { ProjectTabNav };
