import { serverClient } from "@/lib/router";

const redirectTo = (location: string) =>
  new Response(null, { status: 307, headers: { location, "cache-control": "no-store" } });

export const redirectToBaselineBuild = async (
  projectId: string,
  getLocation: (buildId: string) => string,
) => {
  const [error, result] = await serverClient.projects.getBaselineBuild({ projectId });

  if (error?.code === "UNAUTHORIZED") {
    return redirectTo("/login");
  }

  if (error && error.code !== "NOT_FOUND" && error.code !== "BAD_REQUEST") {
    throw error;
  }

  if (!result?.build) {
    return new Response(null, { status: 404 });
  }

  return redirectTo(getLocation(result.build.id));
};
