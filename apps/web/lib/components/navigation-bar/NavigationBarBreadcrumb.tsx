import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { Icon } from "@ovr/ui/components/icon";

type NavigationBarBreadcrumbProps = {
  project?: { id: string; name: string };
  runId?: string;
  /** Adds a trailing segment after the run link. Only meaningful when runId is also set. */
  view?: "diff";
};

const NavigationBarBreadcrumb = ({ project, runId, view }: NavigationBarBreadcrumbProps) => (
  <div className="flex items-center gap-2 text-body-sm whitespace-nowrap min-w-0 overflow-hidden">
    {project ? (
      <>
        <Link
          href={`/projects/${project.id}/runs`}
          className="text-ovr-fg hover:underline underline-offset-2 truncate"
        >
          {project.name}
        </Link>
        {runId && (
          <>
            <Icon icon={ChevronRightIcon} size={12} className="text-ovr-fg-tertiary shrink-0" />
            <Link
              href={`/projects/${project.id}/runs/${runId}`}
              className="text-ovr-fg hover:underline underline-offset-2"
            >
              #{runId}
            </Link>
          </>
        )}
        {runId && view === "diff" && (
          <>
            <Icon icon={ChevronRightIcon} size={12} className="text-ovr-fg-tertiary shrink-0" />
            <span className="text-ovr-fg-tertiary">diff</span>
          </>
        )}
      </>
    ) : (
      <span className="text-ovr-fg-tertiary">projects</span>
    )}
  </div>
);

export { NavigationBarBreadcrumb };
export type { NavigationBarBreadcrumbProps };
