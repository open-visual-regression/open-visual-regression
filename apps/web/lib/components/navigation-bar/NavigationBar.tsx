type NavigationBarProps = {
  children: React.ReactNode;
};

export const NavigationBar = ({ children }: NavigationBarProps) => {
  return <nav className="py-3 px-3 border-b border-b-ovr-border">{children}</nav>;
};
