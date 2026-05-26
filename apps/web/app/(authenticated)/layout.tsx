type AppLayoutProps = Readonly<{
  navigation: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}>;

export default function AppLayout({ navigation, sidebar, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <div className="shrink-0">{navigation}</div>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden shrink-0 md:block md:w-12 lg:w-60">{sidebar}</div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
