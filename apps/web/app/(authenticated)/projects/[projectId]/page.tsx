import { Typography } from "@ovr/ui/components/typography";
import { router } from "@/lib/router";
import { redirect } from "next/navigation";
import { ProjectTabNav } from "./_components/ProjectTabNav";
import { ProjectSettings } from "./_components/project-settings/ProjectSettings";
import { ProjectRuns } from "./_components/project-runs/ProjectRuns";
import { z } from "zod";

type ProjectPageProps = PageProps<"/projects/[projectId]">;

const searchParamsSchema = z.object({
  tab: z.enum(["runs", "settings"]),
});

export default async function ProjectPage(props: ProjectPageProps) {
  const [{ projectId }, rawSearchParams] = await Promise.all([props.params, props.searchParams]);

  const parsed = searchParamsSchema.safeParse(rawSearchParams);

  if (!parsed.success) {
    redirect(`/projects/${projectId}?tab=runs`);
  }

  const [error, result] = await router.projects.getOne({ projectId });

  if (error?.status === 404) {
    redirect("/404");
  }

  if (error) {
    redirect("/error");
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h1" as="h1">
        {result.project.name}
      </Typography>
      <ProjectTabNav projectId={projectId} />
      <div className="py-4">
        {parsed.data.tab === "runs" && <ProjectRuns />}
        {parsed.data.tab === "settings" && <ProjectSettings />}
      </div>
    </div>
  );
}
