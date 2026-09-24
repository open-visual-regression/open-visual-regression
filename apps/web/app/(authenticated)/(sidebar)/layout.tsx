import { SidebarLayout } from "@/lib/components/sidebar/SidebarLayout";

type SidebarGroupLayoutProps = Readonly<{
  sidebar: React.ReactNode;
  children: React.ReactNode;
}>;

// Projects and builds share this layout so the sidebar stays mounted when moving between them.
export default function SidebarGroupLayout({ sidebar, children }: SidebarGroupLayoutProps) {
  return (
    <SidebarLayout sidebar={sidebar} scrollRestorationId="main">
      {children}
    </SidebarLayout>
  );
}
