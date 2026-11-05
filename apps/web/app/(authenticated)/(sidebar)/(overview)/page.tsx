import { BoxIcon, CameraIcon, FolderIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { OverviewLinkCard } from "../_components/OverviewLinkCard";
import { OverviewPageShell } from "../_components/OverviewPageShell";

export default function OverviewPage() {
  return (
    <OverviewPageShell
      heading={
        <Typography variant="h1" as="h1">
          overview
        </Typography>
      }
      links={
        <>
          <OverviewLinkCard href="/projects" icon={FolderIcon} label="projects" />
          <OverviewLinkCard href="/builds" icon={BoxIcon} label="builds" />
          <OverviewLinkCard href="/snapshots" icon={CameraIcon} label="snapshots" />
        </>
      }
    />
  );
}
