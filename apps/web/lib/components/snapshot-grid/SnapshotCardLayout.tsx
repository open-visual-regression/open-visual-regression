import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { CardSurface } from "@/lib/components/card-link/CardSurface";
import { Image } from "@/lib/components/image/Image";

type SnapshotCardSlotProps = {
  className?: string;
  children?: React.ReactNode;
};

export const SnapshotCardPreview = ({ className, children }: SnapshotCardSlotProps) => (
  <div
    className={cn(
      "relative h-40 overflow-hidden border-b border-ovr-border-subtle bg-ovr-inset bg-pixel-grid",
      className,
    )}
  >
    {children}
  </div>
);

const SnapshotCardPreviewMessage = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <Typography variant="caption">{children}</Typography>
  </div>
);

type SnapshotCardImageProps = {
  src: string | null;
  alt: string;
};

export const SnapshotCardImage = ({ src, alt }: SnapshotCardImageProps) =>
  src ? (
    <Image
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
      errorFallback={
        <SnapshotCardPreviewMessage>failed to load snapshot</SnapshotCardPreviewMessage>
      }
    />
  ) : (
    <SnapshotCardPreviewMessage>no preview</SnapshotCardPreviewMessage>
  );

export const SnapshotCardPreviewBadges = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute bottom-2 right-2">{children}</div>
);

export const SnapshotCardBody = ({ className, children }: SnapshotCardSlotProps) => (
  <div className={cn("flex min-w-0 flex-col gap-1 px-3 py-2.5", className)}>{children}</div>
);

export const SnapshotCardSkeleton = ({ className }: { className?: string }) => (
  <CardSurface aria-hidden className={cn("gap-0 py-0", className)}>
    <SnapshotCardPreview />
    <SnapshotCardBody>
      <TypographySkeleton variant="code" className="w-2/3" />
      <TypographySkeleton variant="caption" className="w-1/2" />
      <TypographySkeleton variant="caption" className="w-3/4" />
    </SnapshotCardBody>
  </CardSurface>
);
