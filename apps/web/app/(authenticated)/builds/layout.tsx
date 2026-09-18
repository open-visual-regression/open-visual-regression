import { SidebarLayout } from "@/lib/components/sidebar/SidebarLayout";

type BuildsLayoutProps = Readonly<{
  sidebar: React.ReactNode;
  children: React.ReactNode;
}>;

export default function BuildsLayout({ sidebar, children }: BuildsLayoutProps) {
  return (
    <SidebarLayout sidebar={sidebar} scrollRestorationId="builds-main">
      {children}
    </SidebarLayout>
  );
}
