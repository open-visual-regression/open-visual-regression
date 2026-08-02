import { getBreadcrumbSegments } from "@/lib/components/navigation-bar/getBreadcrumbSegments";
import { NavigationBarBreadcrumb } from "@/lib/components/navigation-bar/NavigationBarBreadcrumb";

type NavigationSlotProps = PageProps<"/[[...pathname]]">;

export default async function NavigationSlot({ params }: NavigationSlotProps) {
  const { pathname } = await params;
  const segments = await getBreadcrumbSegments(pathname ?? []);

  return <NavigationBarBreadcrumb segments={segments} />;
}
