import Link from "next/link";
import { Icon, ChevronRightIcon } from "@ovr/ui/components/icon";

type NavigationBarBreadcrumbProps = {
  project?: { id: string; name: string };
  runId?: string;
  children?: React.ReactNode;
};

type NavigationBarBreadcrumbSegmentProps = {
  label: string;
};

const NavigationBarBreadcrumb = ({ project, runId, children }: NavigationBarBreadcrumbProps) => (
  <div className="flex items-center gap-2 text-body-sm whitespace-nowrap min-w-0 overflow-hidden">
    {project ? (
      <>
        <Link
          href={`/projects/${project.id}/runs`}
          className="text-ovr-fg hover:underline underline-offset-2 truncate"
        >
          {project.name}
        </Link>
        {runId ? (
          <>
            <Icon icon={ChevronRightIcon} size={12} className="text-ovr-fg-tertiary shrink-0" />
            <Link
              href={`/projects/${project.id}/runs/${runId}`}
              className="text-ovr-fg hover:underline underline-offset-2"
            >
              #{runId}
            </Link>
          </>
        ) : null}
        {children}
      </>
    ) : (
      <span className="text-ovr-fg-tertiary">projects</span>
    )}
  </div>
);

const NavigationBarBreadcrumbSegment = ({ label }: NavigationBarBreadcrumbSegmentProps) => (
  <>
    <Icon icon={ChevronRightIcon} size={12} className="text-ovr-fg-tertiary shrink-0" />
    <span className="text-ovr-fg-tertiary">{label}</span>
  </>
);

export { NavigationBarBreadcrumb, NavigationBarBreadcrumbSegment };
export type { NavigationBarBreadcrumbProps, NavigationBarBreadcrumbSegmentProps };
