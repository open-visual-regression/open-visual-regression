import { Typography } from "@ovr/ui/components/typography";

export type SnapshotImageProps = {
  imagePath: string | null;
  alt: string;
};

export const SnapshotImage = ({ imagePath, alt }: SnapshotImageProps) => (
  <div className="relative overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid">
    {imagePath ? (
      <img src={`/api/storage/${imagePath}`} alt={alt} className="h-full w-full object-contain" />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center">
        <Typography variant="caption">no preview</Typography>
      </div>
    )}
  </div>
);
