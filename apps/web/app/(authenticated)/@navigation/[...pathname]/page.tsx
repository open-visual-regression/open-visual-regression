import { NavigationSlot } from "../_components/navigation-slot/NavigationSlot";

type NavigationPageProps = PageProps<"/[...pathname]">;

export default async function NavigationPage({ params }: NavigationPageProps) {
  const { pathname } = await params;

  return <NavigationSlot pathname={pathname} />;
}
