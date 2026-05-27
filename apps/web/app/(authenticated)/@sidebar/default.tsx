import { Sidebar } from "@/lib/components/sidebar/Sidebar";
import { SidebarCollapsed } from "@/lib/components/sidebar/SidebarCollapsed";

export default function SidebarPage() {
  const version = process.env.npm_package_version ?? "0.0.0";

  return (
    <>
      <div className="block h-full lg:hidden">
        <SidebarCollapsed projects={[]} />
      </div>
      <div className="hidden h-full lg:block">
        <Sidebar projects={[]} version={version} />
      </div>
    </>
  );
}
