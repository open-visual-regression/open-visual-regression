import { Sidebar } from "@/lib/components/sidebar/Sidebar";

export default async function SidebarPage() {
  return <Sidebar projects={[]} version={process.env.npm_package_version ?? "0.0.0"} />;
}
