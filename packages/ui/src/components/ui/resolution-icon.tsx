import { Icon, MonitorIcon, SmartphoneIcon, TabletIcon } from "./icon";

type ResolutionIconProps = {
  width: number;
  size?: number;
  className?: string;
};

const ResolutionIcon = ({ width, size = 16, className }: ResolutionIconProps) => {
  const icon = width < 768 ? SmartphoneIcon : width < 1024 ? TabletIcon : MonitorIcon;

  return <Icon icon={icon} size={size} className={className} />;
};

export { ResolutionIcon };
export type { ResolutionIconProps };
