import { cn } from "@ovr/ui/lib/utils";

type NavigationBarProps = {
  children: React.ReactNode;
  className?: string;
};

const NavigationBar = ({ children, className }: NavigationBarProps) => (
  <nav
    className={cn(
      "h-[--topbar-h] flex shrink-0 items-center gap-4 px-3 border-b border-ovr-border bg-background",
      className,
    )}
  >
    {children}
  </nav>
);

export { NavigationBar };
export type { NavigationBarProps };
