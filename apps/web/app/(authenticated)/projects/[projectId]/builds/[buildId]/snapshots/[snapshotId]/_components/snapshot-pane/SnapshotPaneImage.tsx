import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";
import { Image } from "@/lib/components/image/Image";

export type SnapshotPaneImageProps = {
  imagePath: string | null;
  alt: string;
  fill?: boolean;
};

export const SnapshotPaneImage = ({ imagePath, alt, fill = false }: SnapshotPaneImageProps) => (
  <div className="relative min-h-64 overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid lg:min-h-96">
    {imagePath ? (
      <Image
        src={imagePath}
        alt={alt}
        className={cn("h-auto block", fill ? "w-full" : "max-w-full mx-auto")}
        errorFallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <Typography variant="caption">failed to load snapshot</Typography>
          </div>
        }
      />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center">
        <Typography variant="caption">no preview</Typography>
      </div>
    )}
  </div>
);
