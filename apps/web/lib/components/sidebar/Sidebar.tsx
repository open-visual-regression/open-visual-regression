import { SidebarFooter } from "./SidebarFooter";

type SidebarProps = {
  version?: string;
  children?: React.ReactNode;
};

const Sidebar = ({ version, children }: SidebarProps) => (
  <aside className="flex h-full w-60 shrink-0 flex-col overflow-hidden border-r border-ovr-border bg-background">
    {children}
    <SidebarFooter version={version} />
  </aside>
);

export { Sidebar };
export type { SidebarProps };
