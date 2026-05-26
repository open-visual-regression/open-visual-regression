import { SearchIcon } from "lucide-react";
import { Icon } from "@ovr/ui/components/icon";
import { KeyHint } from "@ovr/ui/components/key-hint";

const NavigationBarSearch = () => (
  <>
    <div
      role="button"
      tabIndex={0}
      className="hidden lg:flex ml-auto w-70 h-7 items-center gap-2 px-2.5 bg-ovr-elevated border border-ovr-border rounded-sm text-ovr-fg-tertiary cursor-pointer hover:border-ovr-border-strong transition-colors"
      aria-label="Search runs, snapshots… (⌘K)"
    >
      <Icon icon={SearchIcon} size={12} />
      <span className="text-caption flex-1">search runs, snapshots…</span>
      <KeyHint>⌘K</KeyHint>
    </div>
    <div
      role="button"
      tabIndex={0}
      className="lg:hidden ml-auto flex size-7 items-center justify-center bg-ovr-elevated border border-ovr-border rounded-sm text-ovr-fg-tertiary cursor-pointer hover:border-ovr-border-strong transition-colors"
      aria-label="Search (⌘K)"
    >
      <Icon icon={SearchIcon} size={12} />
    </div>
  </>
);

export { NavigationBarSearch };
