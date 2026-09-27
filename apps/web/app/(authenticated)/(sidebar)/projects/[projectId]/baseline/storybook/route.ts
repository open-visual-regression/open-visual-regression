import { redirectToBaselineBuild } from "@/lib/utils/baseline";
import { getStorybookPath } from "@/lib/utils/storage";

export const GET = async (
  request: Request,
  { params }: RouteContext<"/projects/[projectId]/baseline/storybook">,
) => {
  const { projectId } = await params;
  const { search } = new URL(request.url);

  return redirectToBaselineBuild(projectId, (buildId) => `${getStorybookPath(buildId)}${search}`);
};
