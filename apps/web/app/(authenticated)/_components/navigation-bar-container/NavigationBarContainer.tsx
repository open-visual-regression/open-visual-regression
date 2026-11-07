import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";

import { getSignOutUrl } from "@/lib/auth/config";
import { toRole } from "@/lib/auth/roles";
import { getCachedSession } from "@/lib/auth/session";
import {
  getBreadcrumbTrail,
  prefetchBreadcrumbQuery,
  toPathSegments,
} from "@/lib/components/navigation-bar/getBreadcrumbTrail";
import { NavigationBarBreadcrumbContainer } from "@/lib/components/navigation-bar/NavigationBarBreadcrumbContainer";
import { getQueryClient } from "@/lib/orpc/query-client";
import { orpcServer } from "@/lib/orpc/server";
import { serverClient } from "@/lib/router";
import { REQUEST_PATH_HEADER } from "@/lib/utils/redirects";

import { NavigationBarContent } from "../navigation-bar-content/NavigationBarContent";

const NAVIGATION_PROJECTS_LIMIT = 10;
const NAVIGATION_RECENT_BUILDS_LIMIT = 15;

const prefetchBreadcrumbTrail = async () => {
  const requestPath = (await headers()).get(REQUEST_PATH_HEADER) ?? "/";
  const queryClient = getQueryClient();

  await Promise.all(
    getBreadcrumbTrail(toPathSegments(requestPath)).map(({ segment, resource }) =>
      resource ? prefetchBreadcrumbQuery(queryClient, orpcServer, segment, resource) : undefined,
    ),
  );

  return dehydrate(queryClient);
};

export const NavigationBarContainer = async () => {
  const [session, breadcrumbState] = await Promise.all([
    getCachedSession().catch(() => null),
    prefetchBreadcrumbTrail(),
  ]);

  const userName = session?.user?.name ?? session?.user?.email ?? "";

  const [[listError, listResult], [countError, countResult], [buildsError, buildsResult]] =
    await Promise.all([
      serverClient.projects.list({ limit: NAVIGATION_PROJECTS_LIMIT }),
      serverClient.projects.count(),
      serverClient.builds.list({ limit: NAVIGATION_RECENT_BUILDS_LIMIT }),
    ]);
  const projects = listError ? [] : listResult.projects;
  const projectsTotal = countError ? 0 : countResult.total;
  const builds = buildsError ? [] : buildsResult.builds;

  return (
    <NavigationBarContent
      role={toRole(session?.user?.role)}
      projects={projects}
      projectsTotal={projectsTotal}
      builds={builds}
      breadcrumb={
        <HydrationBoundary state={breadcrumbState}>
          <NavigationBarBreadcrumbContainer />
        </HydrationBoundary>
      }
      userName={userName}
      signOutUrl={getSignOutUrl()}
    />
  );
};
