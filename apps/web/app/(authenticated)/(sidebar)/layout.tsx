import { SidebarLayout } from "@/lib/components/sidebar/SidebarLayout";

type SidebarGroupLayoutProps = Readonly<{
  sidebar: React.ReactNode;
  children: React.ReactNode;
}>;

export default function SidebarGroupLayout({ sidebar, children }: SidebarGroupLayoutProps) {
  return (
    <SidebarLayout sidebar={sidebar} scrollRestorationId="main">
      {children}
    </SidebarLayout>
  );
}
