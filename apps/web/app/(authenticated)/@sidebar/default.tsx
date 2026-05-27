import { SidebarContainer } from "@/lib/components/sidebar/SidebarContainer";

export default function SidebarPage() {
  const version = process.env.npm_package_version ?? "0.0.0";

  return <SidebarContainer projects={[]} version={version} />;
}
