type ProjectsLayoutProps = Readonly<{
  sidebar: React.ReactNode;
  children: React.ReactNode;
}>;

export default function ProjectsLayout({ sidebar, children }: ProjectsLayoutProps) {
  return (
    <>
      <div className="hidden shrink-0 md:block">{sidebar}</div>
      <main className="relative flex-1 overflow-auto py-3 px-5 md:py-4 md:px-6 lg:py-6 lg:px-10">
        {children}
      </main>
    </>
  );
}
