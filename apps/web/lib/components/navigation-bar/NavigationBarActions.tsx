import { UserAvatar } from "./UserAvatar";

type NavigationBarActionsProps = {
  userName: string;
  signOutUrl?: string;
};

const NavigationBarActions = ({ userName, signOutUrl }: NavigationBarActionsProps) => (
  <div className="flex items-center gap-1 shrink-0">
    <UserAvatar name={userName} signOutUrl={signOutUrl} />
  </div>
);

export { NavigationBarActions };
export type { NavigationBarActionsProps };
