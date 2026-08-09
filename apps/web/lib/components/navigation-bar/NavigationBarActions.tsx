import { UserAvatar } from "./UserAvatar";

type NavigationBarActionsProps = {
  userName: string;
};

const NavigationBarActions = ({ userName }: NavigationBarActionsProps) => (
  <div className="flex items-center gap-1 shrink-0">
    <UserAvatar name={userName} />
  </div>
);

export { NavigationBarActions };
export type { NavigationBarActionsProps };
