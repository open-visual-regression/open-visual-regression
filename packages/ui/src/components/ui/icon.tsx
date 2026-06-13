import type { LucideIcon } from "lucide-react";
export {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  FolderIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  KeyRoundIcon,
  LogOutIcon,
  MailIcon,
  MenuIcon,
  MonitorIcon,
  SearchIcon,
  SettingsIcon,
  PlusIcon,
  CircleSlash2Icon,
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
