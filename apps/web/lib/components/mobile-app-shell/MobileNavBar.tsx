import { MenuIcon } from "lucide-react";
import { Icon } from "@ovr/ui/components/icon";

type MobileNavBarProps = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onMenu?: () => void;
};

const MobileNavBar = ({ title, subtitle, leading, trailing, onMenu }: MobileNavBarProps) => (
  <div className="h-[--topbar-h] shrink-0 flex items-center gap-2 px-2 border-b border-ovr-border bg-background">
    {leading ?? (
      <button
        onClick={onMenu}
        className="size-9 flex items-center justify-center bg-transparent border-none text-ovr-fg cursor-pointer"
        aria-label="menu"
      >
        <Icon icon={MenuIcon} size={16} />
      </button>
    )}
    <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
      <div className="text-[14px] font-medium tracking-[-0.01em] text-ovr-fg truncate">{title}</div>
      {subtitle && <div className="text-[10px] text-ovr-fg-tertiary truncate">{subtitle}</div>}
    </div>
    {trailing}
  </div>
);

export { MobileNavBar };
export type { MobileNavBarProps };
