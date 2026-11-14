import { BoxIcon, CameraIcon, FolderIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { OverviewLinkCard } from "../_components/OverviewLinkCard";
import { OverviewPageShell } from "../_components/OverviewPageShell";

export default function OverviewPage() {
  return (
    <OverviewPageShell
      heading={
        <Typography variant="h1" as="h1">
          Overview
        </Typography>
      }
      links={
        <>
          <OverviewLinkCard href="/projects" icon={FolderIcon} label="Projects" />
          <OverviewLinkCard href="/builds" icon={BoxIcon} label="Builds" />
          <OverviewLinkCard href="/snapshots" icon={CameraIcon} label="Snapshots" />
        </>
      }
    />
  );
}
