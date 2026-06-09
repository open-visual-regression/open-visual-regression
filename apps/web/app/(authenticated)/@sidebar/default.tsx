import { SidebarContainer } from "@/lib/components/sidebar/SidebarContainer";
import { router } from "@/lib/router";
import { redirect } from "next/navigation";

export default async function SidebarPage() {
  const [error, projectsResult] = await router.projects.list();

  if (error) {
    redirect("/error");
  }

  return (
    <SidebarContainer
      projects={projectsResult.projects}
      version={process.env.npm_package_version}
    />
  );
}
