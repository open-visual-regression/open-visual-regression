import { SidebarLayout } from "@/lib/components/sidebar/SidebarLayout";

type ProjectsLayoutProps = Readonly<{
  sidebar: React.ReactNode;
  children: React.ReactNode;
}>;

export default function ProjectsLayout({ sidebar, children }: ProjectsLayoutProps) {
  return (
    <SidebarLayout sidebar={sidebar} scrollRestorationId="projects-main">
      {children}
    </SidebarLayout>
  );
}
