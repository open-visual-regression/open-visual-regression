import { Typography } from "@ovr/ui/components/typography";
import { SnapshotImage } from "../../snapshot-image/SnapshotImage";
import { DiffOverlay } from "../../diff-overlay/DiffOverlay";

export type NewPaneProps = {
  imagePath: string | null;
  diffImagePath: string | null;
  alt: string;
};

export const NewPane = ({ imagePath, diffImagePath, alt }: NewPaneProps) => {
  if (diffImagePath) {
    return (
      <DiffOverlay label="new" imagePath={imagePath} diffImagePath={diffImagePath} alt={alt} />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-7 items-center">
        <Typography variant="label">new</Typography>
      </div>
      <SnapshotImage imagePath={imagePath} alt={alt} />
    </div>
  );
};
