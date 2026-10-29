import type {
  GithubAppInstallationSchema,
  GithubAppSchema,
  GithubAppStatusSchema,
} from "@ovr/api/contracts/githubApp";
import { Badge } from "@ovr/ui/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ovr/ui/components/card";
import { FieldSkeleton } from "@ovr/ui/components/field";
import { ExternalLinkIcon, Icon } from "@ovr/ui/components/icon";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { ExternalLink } from "@/lib/components/external-link/ExternalLink";

export const GITHUB_APP_SETUP_GUIDE_URL =
  "https://docs.openvisualregression.com/self-hosting/github-app";

type GithubAppSectionProps = {
  status: GithubAppStatusSchema;
};

const describeRepositories = ({
  repositorySelection,
  repositoryCount,
}: GithubAppInstallationSchema): string => {
  if (repositorySelection === "all") {
    return "all repositories";
  }
  if (repositoryCount === null) {
    return "selected repositories";
  }
  return repositoryCount === 1 ? "1 repository" : `${repositoryCount} repositories`;
};

const InstallationRow = ({ installation }: { installation: GithubAppInstallationSchema }) => (
  <li className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 @md:flex-row @md:items-center @md:justify-between">
    <div className="flex flex-wrap items-center gap-2">
      <Typography variant="body">{installation.accountLogin ?? "unknown account"}</Typography>
      {installation.accountType ? (
        <Typography variant="caption">({installation.accountType.toLowerCase()})</Typography>
      ) : null}
      {installation.suspended ? <Badge color="amber">suspended</Badge> : null}
    </div>
    <div className="flex items-center gap-4">
      <Typography variant="caption">{describeRepositories(installation)}</Typography>
      <ExternalLink href={installation.htmlUrl}>configure</ExternalLink>
    </div>
  </li>
);

const InstallLink = ({ app, label }: { app: GithubAppSchema; label: string }) => (
  <ButtonLink
    href={app.installUrl}
    target="_blank"
    rel="noopener noreferrer"
    variant="outline"
    className="w-full @md:w-auto"
  >
    {label}
    <Icon icon={ExternalLinkIcon} size={12} />
  </ButtonLink>
);

const ConfiguredCard = ({
  app,
  installations,
}: Extract<GithubAppStatusSchema, { status: "ok" }>) => {
  const installed = installations.length > 0;
  const canWriteStatuses = app.permissions.statuses === "write";

  return (
    <Card className="@container">
      <CardHeader>
        <CardTitle>{app.name}</CardTitle>
        <CardDescription>
          {app.ownerLogin ? `owned by ${app.ownerLogin} · ` : null}
          commit statuses: {app.permissions.statuses ?? "no access"}
        </CardDescription>
        <CardAction>
          {installed ? (
            <Badge color="green">connected</Badge>
          ) : (
            <Badge color="amber">not installed</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canWriteStatuses ? null : (
          <Typography variant="body" as="p" className="text-ovr-red">
            the app can&apos;t write commit statuses. grant &quot;commit statuses: read &amp;
            write&quot; in the app&apos;s settings.
          </Typography>
        )}
        {installed ? (
          <div className="flex flex-col gap-2">
            <Typography variant="label" as="h3">
              installations
            </Typography>
            <ul className="flex flex-col divide-y divide-ovr-border">
              {installations.map((installation) => (
                <InstallationRow key={installation.id} installation={installation} />
              ))}
            </ul>
          </div>
        ) : (
          <Typography variant="body-muted" as="p">
            install the app on your github organization and choose the repositories ovr can post
            statuses to.
          </Typography>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <InstallLink
          app={app}
          label={installed ? "install on another account" : "install on github"}
        />
      </CardFooter>
    </Card>
  );
};

export const GithubAppSection = ({ status }: GithubAppSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <Typography variant="h2" as="h2">
        github app
      </Typography>
      <Typography variant="body-muted" as="p">
        post commit statuses through your own github app instead of personal access tokens.
      </Typography>
    </div>
    {status.status === "ok" ? <ConfiguredCard {...status} /> : null}
    {status.status === "error" ? (
      <Card>
        <CardHeader>
          <CardTitle>github app</CardTitle>
          <CardDescription>{status.error}</CardDescription>
          <CardAction>
            <Badge color="red">error</Badge>
          </CardAction>
        </CardHeader>
      </Card>
    ) : null}
    {status.status === "not_configured" ? (
      <Card className="@container">
        <CardHeader>
          <CardTitle>not configured</CardTitle>
          <CardDescription>
            set OVR_GITHUB_APP_CLIENT_ID and OVR_GITHUB_APP_PRIVATE_KEY to post commit statuses
            through a github app.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          <ExternalLink href={GITHUB_APP_SETUP_GUIDE_URL}>read the setup guide</ExternalLink>
        </CardFooter>
      </Card>
    ) : null}
  </div>
);

export const GithubAppSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <TypographySkeleton variant="h2" className="w-32" />
      <TypographySkeleton variant="body-muted" className="w-72" />
    </div>
    <Card>
      <CardContent className="flex flex-col gap-5">
        <FieldSkeleton />
        <FieldSkeleton />
      </CardContent>
    </Card>
  </div>
);
