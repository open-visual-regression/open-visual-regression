import { Button } from "@ovr/ui/components/button";
import { Icon, MenuIcon } from "@ovr/ui/components/icon";

type MobileNavBarProps = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onMenu?: () => void;
};

const MobileNavBar = ({ title, subtitle, leading, trailing, onMenu }: MobileNavBarProps) => (
  <div className="shrink-0 flex items-center gap-2 px-2 py-2.5 border-b border-ovr-border bg-background">
    {leading ?? (
      <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Open navigation menu">
        <Icon icon={MenuIcon} size={16} />
      </Button>
    )}
    <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
      <div className="text-sm font-medium tracking-h1 text-ovr-fg truncate">{title}</div>
      {subtitle ? <div className="text-badge text-ovr-fg-tertiary truncate">{subtitle}</div> : null}
    </div>
    {trailing}
  </div>
);

export { MobileNavBar };
export type { MobileNavBarProps };
