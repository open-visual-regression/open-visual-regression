import { PixelGrid } from "@ovr/ui/components/pixel-grid";

type UnauthenticatedLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function UnauthenticatedLayout({ children }: UnauthenticatedLayoutProps) {
  return <PixelGrid className="min-h-screen flex flex-col">{children}</PixelGrid>;
}
