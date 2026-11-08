import { describe, expect, it } from "@/test-utils";

import { getBreadcrumbTrail, toPathSegments } from "../getBreadcrumbTrail";

const PROJECT_ID = "018f0000-0000-7000-8000-000000000001";
const BUILD_ID = "018f0000-0000-7000-8000-000000000002";
const SNAPSHOT_ID = "018f0000-0000-7000-8000-000000000003";

describe("getBreadcrumbTrail", () => {
  it("should return the overview segment for the overview page", () => {
    expect(getBreadcrumbTrail([])).toEqual([{ segment: "", label: "overview" }]);
  });

  it("should treat the new project segment as a literal", () => {
    expect(getBreadcrumbTrail(["projects", "new"])).toEqual([
      { segment: "projects", label: "projects", href: "/projects" },
      { segment: "new", label: "new" },
    ]);
  });

  it("should mark the project segment as a project resource", () => {
    expect(getBreadcrumbTrail(["projects", PROJECT_ID, "settings"])).toEqual([
      { segment: "projects", label: "projects", href: "/projects" },
      {
        segment: PROJECT_ID,
        label: PROJECT_ID,
        href: `/projects/${PROJECT_ID}`,
        resource: "project",
      },
      { segment: "settings", label: "settings" },
    ]);
  });

  it("should return a single segment for the all-builds page", () => {
    expect(getBreadcrumbTrail(["builds"])).toEqual([{ segment: "builds", label: "builds" }]);
  });

  it("should return a single segment for the all-snapshots page", () => {
    expect(getBreadcrumbTrail(["snapshots"])).toEqual([
      { segment: "snapshots", label: "snapshots" },
    ]);
  });

  it("should humanize static segments outside of projects", () => {
    expect(getBreadcrumbTrail(["settings", "access-tokens"])).toEqual([
      { segment: "settings", label: "settings", href: "/settings" },
      { segment: "access-tokens", label: "access tokens" },
    ]);
  });

  it("should filter the builds and snapshots segments and link each resource to its page", () => {
    expect(
      getBreadcrumbTrail(["projects", PROJECT_ID, "builds", BUILD_ID, "snapshots", SNAPSHOT_ID]),
    ).toEqual([
      { segment: "projects", label: "projects", href: "/projects" },
      {
        segment: PROJECT_ID,
        label: PROJECT_ID,
        href: `/projects/${PROJECT_ID}`,
        resource: "project",
      },
      {
        segment: BUILD_ID,
        label: BUILD_ID,
        href: `/projects/${PROJECT_ID}/builds/${BUILD_ID}`,
        resource: "build",
      },
      { segment: SNAPSHOT_ID, label: SNAPSHOT_ID, resource: "snapshot" },
    ]);
  });
});

describe("toPathSegments", () => {
  it("should split a request path into decoded segments without the query string", () => {
    expect(toPathSegments("/projects/acme%20web/builds?status=failed")).toEqual([
      "projects",
      "acme web",
      "builds",
    ]);
  });

  it("should return no segments for the root path", () => {
    expect(toPathSegments("/")).toEqual([]);
  });
});
