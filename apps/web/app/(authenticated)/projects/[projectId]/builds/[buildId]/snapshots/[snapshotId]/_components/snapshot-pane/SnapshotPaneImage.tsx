import { Typography } from "@ovr/ui/components/typography";

export type SnapshotPaneImageProps = {
  imagePath: string | null;
  alt: string;
};

export const SnapshotPaneImage = ({ imagePath, alt }: SnapshotPaneImageProps) => (
  <div className="relative overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid">
    {imagePath ? (
      <img src={imagePath} alt={alt} className="max-w-full h-auto mx-auto block" />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center">
        <Typography variant="caption">no preview</Typography>
      </div>
    )}
  </div>
);
