import { SnapshotImage } from "../snapshot-image/SnapshotImage";

export type SingleSnapshotProps = {
  imagePath: string | null;
  alt: string;
};

export const SingleSnapshot = ({ imagePath, alt }: SingleSnapshotProps) => (
  <div className="grid grid-cols-1 gap-4">
    <SnapshotImage imagePath={imagePath} alt={alt} />
  </div>
);
