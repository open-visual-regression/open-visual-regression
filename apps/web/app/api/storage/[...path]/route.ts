import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { auth } from "@/lib/auth/auth";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const handleGet = async (request: Request, { params }: RouteContext) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.session.activeOrganizationId) {
    return new Response(null, { status: 401 });
  }

  const { path } = await params;
  const projectId = path[0]!;

  const project = await dbClient.projects.getProject({
    projectId,
    organizationId: session.session.activeOrganizationId,
  });

  if (!project) {
    return new Response(null, { status: 403 });
  }

  const url = await storage.getPresignedUrl(path.join("/"), 60);

  return Response.redirect(url, 302);
};

export const GET = handleGet;
