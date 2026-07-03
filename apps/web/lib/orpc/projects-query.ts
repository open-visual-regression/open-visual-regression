import { type ProjectsCursor } from "@ovr/api/contracts/projects";

const PROJECTS_PAGE_SIZE = 42;

type ProjectsListInput = {
  limit: number;
  cursor: ProjectsCursor | undefined;
};

type ProjectsListInfiniteOptions = {
  input: (cursor: ProjectsCursor | undefined) => ProjectsListInput;
  initialPageParam: ProjectsCursor | undefined;
  getNextPageParam: (lastPage: { nextCursor: ProjectsCursor | null }) => ProjectsCursor | undefined;
};

export const projectsListInfiniteOptions = (): ProjectsListInfiniteOptions => ({
  input: (cursor) => ({ limit: PROJECTS_PAGE_SIZE, cursor }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
