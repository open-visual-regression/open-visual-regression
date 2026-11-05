import type { OvrClient } from "../../client";
import { isShallowRepository, listAncestorCommits } from "../../git";

const MAX_ANCESTORS = 1000;

export type BaseBuild = { id: string; commitSha: string };

export type BaseBuildLookup =
  | { status: "found"; build: BaseBuild }
  | { status: "missing"; reason: string };

type FindBaseBuildInput = {
  client: Pick<OvrClient, "builds">;
  cwd: string;
  log?: (message: string) => void;
};

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message.split("\n")[0]! : String(error);

// The nearest successful main-branch build in this commit's history: the merge base a
// branch build is compared against, and what --only-affected traces changes from.
export const findBaseBuild = async ({
  client,
  cwd,
  log = console.log,
}: FindBaseBuildInput): Promise<BaseBuildLookup> => {
  let commits: string[];
  try {
    if (await isShallowRepository(cwd)) {
      log(
        "Warning: this is a shallow clone, so the last main-branch build may be out of reach. Fetch the full history (e.g. actions/checkout with fetch-depth: 0).",
      );
    }
    commits = await listAncestorCommits(cwd, "HEAD", MAX_ANCESTORS);
  } catch (error) {
    return {
      status: "missing",
      reason: `could not read the git history (${describeError(error)})`,
    };
  }

  let build: BaseBuild | null;
  try {
    ({ build } = await client.builds.findAncestorBuild({ commitShas: commits }));
  } catch (error) {
    return {
      status: "missing",
      reason: `the server could not find a build to compare against (${describeError(error)})`,
    };
  }

  if (!build) {
    return {
      status: "missing",
      reason: "no successful main-branch build was found in this commit's history",
    };
  }

  if (!commits.includes(build.commitSha)) {
    return {
      status: "missing",
      reason: "the server returned a build that is not in this commit's history",
    };
  }

  return { status: "found", build };
};
