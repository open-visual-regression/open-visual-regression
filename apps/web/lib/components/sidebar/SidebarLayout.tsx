import { ScrollContainer } from "@/lib/providers/ScrollContainer";

type SidebarLayoutProps = Readonly<{
  sidebar: React.ReactNode;
  scrollRestorationId: string;
  children: React.ReactNode;
}>;

export const SidebarLayout = ({ sidebar, scrollRestorationId, children }: SidebarLayoutProps) => (
  <>
    <div className="hidden shrink-0 md:block">{sidebar}</div>
    <ScrollContainer
      as="main"
      data-scroll-restoration-id={scrollRestorationId}
      className="relative flex-1 overflow-auto py-3 px-5 md:py-4 md:px-6 lg:py-6 lg:px-10"
    >
      {children}
    </ScrollContainer>
  </>
);
