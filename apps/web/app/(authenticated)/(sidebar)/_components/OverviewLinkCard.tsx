import { CardHeader } from "@ovr/ui/components/card";
import { Icon, type LucideIcon } from "@ovr/ui/components/icon";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { CardLink } from "@/lib/components/card-link/CardLink";
import { CardSurface } from "@/lib/components/card-link/CardSurface";

type OverviewLinkCardProps = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export const OverviewLinkCard = ({ href, icon, label }: OverviewLinkCardProps) => (
  <li>
    <CardLink href={href}>
      <CardHeader>
        <Typography variant="h3" className="flex flex-row items-center gap-3">
          <Icon icon={icon} />
          {label}
        </Typography>
      </CardHeader>
    </CardLink>
  </li>
);

export const OverviewLinkCardSkeleton = () => (
  <li aria-hidden>
    <CardSurface>
      <CardHeader>
        <TypographySkeleton variant="h3" className="w-32" />
      </CardHeader>
    </CardSurface>
  </li>
);
