type RequiresAdminRoleProps = {
  children: React.ReactNode;
  role: string | null | undefined;
};

export const RequiresAdminRole = ({ children, role }: RequiresAdminRoleProps) => {
  if (role !== "admin") {
    return null;
  }

  return children;
};
