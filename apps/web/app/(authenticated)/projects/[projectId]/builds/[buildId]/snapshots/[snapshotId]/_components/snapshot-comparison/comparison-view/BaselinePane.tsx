import { Typography } from "@ovr/ui/components/typography";
import { SnapshotImage } from "../../snapshot-image/SnapshotImage";

export type BaselinePaneProps = {
  imagePath: string | null;
  alt: string;
};

export const BaselinePane = ({ imagePath, alt }: BaselinePaneProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex h-7 items-center">
      <Typography variant="label">baseline</Typography>
    </div>
    <SnapshotImage imagePath={imagePath} alt={alt} />
  </div>
);
