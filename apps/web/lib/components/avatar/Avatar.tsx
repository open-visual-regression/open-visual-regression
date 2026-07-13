import { cn } from "@ovr/ui/lib/utils";

import { getMonogram } from "@/lib/utils/monogram";

type AvatarProps = {
  name: string;
  image?: string | null;
  className?: string;
};

const Avatar = ({ name, image, className }: AvatarProps) => {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={cn(
          "size-7 shrink-0 rounded-sm border border-ovr-border object-cover",
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-sm border border-ovr-border text-badge font-semibold uppercase",
        className,
      )}
    >
      {getMonogram(name)}
    </span>
  );
};

export { Avatar };
export type { AvatarProps };
