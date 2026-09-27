import { redirectToBaselineBuild } from "@/lib/utils/baseline";

export const GET = async (
  _request: Request,
  { params }: RouteContext<"/projects/[projectId]/baseline">,
) => {
  const { projectId } = await params;

  return redirectToBaselineBuild(
    projectId,
    (buildId) => `/projects/${projectId}/builds/${buildId}`,
  );
};
