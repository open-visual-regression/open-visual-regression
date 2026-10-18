type SnapshotBadgesProps = {
  children: React.ReactNode;
};

export const SnapshotBadges = ({ children }: SnapshotBadgesProps) => (
  <div className="inline-flex gap-1">{children}</div>
);
