import type { LucideIcon } from "lucide-react";
export {
  ArrowLeftFromLineIcon,
  ArrowRightToLineIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  CornerLeftUpIcon,
  FolderIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  ExternalLinkIcon,
  GlobeIcon,
  KeyRoundIcon,
  ListFilterIcon,
  LogOutIcon,
  MailIcon,
  Maximize2Icon,
  MenuIcon,
  MilestoneIcon,
  MinusIcon,
  MonitorIcon,
  SearchIcon,
  SettingsIcon,
  SnowflakeIcon,
  PlayIcon,
  PlusIcon,
  CircleSlash2Icon,
  RefreshCwIcon,
  SmartphoneIcon,
  TabletIcon,
  TimerIcon,
  TriangleAlertIcon,
  UserIcon,
  UsersIcon,
  XIcon,
  ScanIcon,
} from "lucide-react";

type IconProps = React.SVGProps<SVGSVGElement> & {
  icon: LucideIcon;
  size?: number;
};

const Icon = ({ icon: LucideIconComponent, size = 16, ...props }: IconProps) => (
  <LucideIconComponent
    width={size}
    height={size}
    strokeWidth={1.5}
    strokeLinecap="square"
    strokeLinejoin="miter"
    {...props}
  />
);

export { Icon };
export type { IconProps, LucideIcon };
