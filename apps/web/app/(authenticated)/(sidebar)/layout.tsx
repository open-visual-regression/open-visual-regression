import { SidebarLayout } from "@/lib/components/sidebar/SidebarLayout";

type SidebarGroupLayoutProps = Readonly<{
  sidebar: React.ReactNode;
  children: React.ReactNode;
}>;

// Projects and builds share this layout so the sidebar stays mounted when moving between them.
// Never add a loading.tsx at this level: Next.js renders it in every slot, including @sidebar.
export default function SidebarGroupLayout({ sidebar, children }: SidebarGroupLayoutProps) {
  return (
    <SidebarLayout sidebar={sidebar} scrollRestorationId="main">
      {children}
    </SidebarLayout>
  );
}
