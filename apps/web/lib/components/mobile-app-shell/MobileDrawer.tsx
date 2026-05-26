import { FolderIcon } from "lucide-react";
import { Logo } from "../logo/Logo";
import { MobileNavItem } from "./MobileNavItem";

type MobileDrawerProject = {
  id: string;
  name: string;
  changedCount?: number;
};

type MobileDrawerProps = {
  open: boolean;
  projects: MobileDrawerProject[];
  activeProjectId?: string;
  version?: string;
  onClose: () => void;
};

const MobileDrawer = ({ open, projects, activeProjectId, version, onClose }: MobileDrawerProps) => {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden="true" />
      <div className="absolute top-0 bottom-0 left-0 w-70 bg-background border-r border-ovr-border flex flex-col overflow-hidden">
        <div className="h-[--topbar-h] shrink-0 px-3 border-b border-ovr-border flex items-center gap-2 justify-between">
          <Logo size="sm" />
          <span className="text-[10px] text-ovr-fg-tertiary">v{version ?? "0.0.0"}</span>
        </div>

        <div className="flex-1 overflow-auto pb-4">
          <div className="px-3 pt-3.5 pb-1.5">
            <span className="text-[10px] font-semibold tracking-label uppercase text-ovr-fg-tertiary">
              projects
            </span>
          </div>
          {projects.map((p) => (
            <MobileNavItem
              key={p.id}
              href={`/projects/${p.id}/runs`}
              icon={FolderIcon}
              label={p.name}
              active={p.id === activeProjectId}
              onClick={onClose}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export { MobileDrawer };
export type { MobileDrawerProps, MobileDrawerProject };
