import { CardHeader } from "@ovr/ui/components/card";
import { Icon, type LucideIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { CardLink } from "@/lib/components/card-link/CardLink";

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
