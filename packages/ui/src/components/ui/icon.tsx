import type { LucideIcon } from "lucide-react";
export {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  FolderIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  ExternalLinkIcon,
  GlobeIcon,
  KeyRoundIcon,
  ListFilterIcon,
  LogOutIcon,
  MailIcon,
  MenuIcon,
  MonitorIcon,
  SearchIcon,
  SettingsIcon,
  PlusIcon,
  CircleSlash2Icon,
  SmartphoneIcon,
  TabletIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
  XIcon,
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
