import { Icon, MonitorIcon, SmartphoneIcon, TabletIcon } from "./icon";

type ResolutionIconProps = {
  width: number;
  size?: number;
  className?: string;
};

const getIconForWidth = (width: number) => {
  if (width < 768) {
    return SmartphoneIcon;
  }
  if (width < 1024) {
    return TabletIcon;
  }
  return MonitorIcon;
};

const ResolutionIcon = ({ width, size = 16, className }: ResolutionIconProps) => (
  <Icon icon={getIconForWidth(width)} size={size} className={className} />
);

export { ResolutionIcon };
export type { ResolutionIconProps };
