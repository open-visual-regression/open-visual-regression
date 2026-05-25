type SidebarProps = Readonly<{
  children: React.ReactNode;
}>;

export const Sidebar = ({ children }: SidebarProps) => {
  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-r border-ovr-border">
      {children}
    </aside>
  );
};
