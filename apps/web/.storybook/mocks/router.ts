import { implement } from "@orpc/server";

import { contract } from "@ovr/api/contracts/contract";

import type { serverClient as RealServerClient } from "../../lib/router";

const os = implement(contract);

const fakeUuid = "00000000-0000-7000-8000-000000000000";

export const serverClient: typeof RealServerClient = {
  apiKeys: {
    create: os.apiKeys.create.handler(() => ({ key: "" })).actionable(),
    list: os.apiKeys.list.handler(() => ({ apiKeys: [], total: 0 })).actionable(),
    revoke: os.apiKeys.revoke.handler(() => undefined).actionable(),
  },
  setup: {
    status: os.setup.status.handler(() => ({ status: "completed" as const })).actionable(),
    exec: os.setup.exec.handler(() => undefined).actionable(),
  },
  projects: {
    getOne: os.projects.getOne
      .handler(() => ({
        project: {
          id: fakeUuid,
          name: "",
          description: null,
          gitMainBranch: "main",
          retentionDays: 30,
          requiredReviewerCount: 1,
          totalBuildsCount: 0,
          creator: { id: "", name: "", email: "" },
          createdAt: new Date().toISOString(),
        },
      }))
      .actionable(),
    list: os.projects.list.handler(() => ({ projects: [], nextCursor: null })).actionable(),
    count: os.projects.count.handler(() => ({ total: 0 })).actionable(),
    add: os.projects.add.handler(() => ({ projectId: fakeUuid })).actionable(),
    update: os.projects.update.handler(() => undefined).actionable(),
    deleteProject: os.projects.deleteProject.handler(() => undefined).actionable(),
  },
  storage: {
    getObject: os.storage.getObject
      .handler(() => ({ status: 302 as const, headers: { location: "" } }))
      .actionable(),
  },
  builds: {
    createBuild: os.builds.createBuild.handler(() => ({ buildId: "", uploadUrl: "" })).actionable(),
    confirmUpload: os.builds.confirmUpload.handler(() => ({ ok: true as const })).actionable(),
    getBuildStatus: os.builds.getBuildStatus
      .handler(() => ({ status: "pending" as const }))
      .actionable(),
    list: os.builds.list.handler(() => ({ builds: [], total: 0, nextCursor: null })).actionable(),
    getOne: os.builds.getOne
      .handler(() => ({
        build: {
          id: fakeUuid,
          project: { id: fakeUuid, name: "" },
          branch: "main",
          commitSha: "",
          name: null,
          author: null,
          errorMessage: null,
          status: "pending" as const,
          createdAt: new Date().toISOString(),
        },
      }))
      .actionable(),
    watchStatus: os.builds.watchStatus
      .handler(async function* () {
        yield { status: "queued" as const };
      })
      .actionable(),
  },
  account: {
    updateAccountInformation: os.account.updateAccountInformation
      .handler(() => undefined)
      .actionable(),
    updatePassword: os.account.updatePassword.handler(() => undefined).actionable(),
  },
  users: {
    list: os.users.list.handler(() => ({ users: [], total: 0 })).actionable(),
    invite: os.users.invite.handler(() => ({ invitationUrl: "" })).actionable(),
    remove: os.users.remove.handler(() => undefined).actionable(),
  },
  invitations: {
    getInvitation: os.invitations.getInvitation
      .handler(() => ({
        email: "",
        organizationName: "",
        role: null,
        expiresAt: new Date(),
      }))
      .actionable(),
    acceptInvitation: os.invitations.acceptInvitation.handler(() => undefined).actionable(),
  },
  gitIntegrations: {
    get: os.gitIntegrations.get.handler(() => ({ integration: null })).actionable(),
    upsert: os.gitIntegrations.upsert
      .handler(() => ({
        provider: "github" as const,
        baseUrl: null,
        repoIdentifier: "",
        checkContext: "ovr/visual-review",
        hasToken: true as const,
      }))
      .actionable(),
    remove: os.gitIntegrations.remove.handler(() => undefined).actionable(),
    testConnection: os.gitIntegrations.testConnection
      .handler(() => ({ ok: true, httpStatus: 200, error: null }))
      .actionable(),
  },
  diffs: {
    castVote: os.diffs.castVote.handler(() => undefined).actionable(),
    removeVote: os.diffs.removeVote.handler(() => undefined).actionable(),
    bulkCastVote: os.diffs.bulkCastVote.handler(() => undefined).actionable(),
    getOne: os.diffs.getOne.handler(() => ({ diff: null })).actionable(),
    listReviews: os.diffs.listReviews
      .handler(() => ({ reviews: [], requiredReviewerCount: 1 }))
      .actionable(),
  },
  snapshots: {
    getOne: os.snapshots.getOne
      .handler(() => ({
        snapshot: {
          id: fakeUuid,
          browser: "chromium",
          viewportWidth: 1280,
          viewportHeight: null,
          targetId: "story--id",
          targetName: "",
          targetTitle: "",
          imagePath: null,
          status: "pending" as const,
          errorLogs: [],
        },
      }))
      .actionable(),
    list: os.snapshots.list.handler(() => ({ snapshots: [], total: 0 })).actionable(),
    getCounts: os.snapshots.getCounts
      .handler(() => ({
        unchanged: 0,
        auto_approved: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 0,
        canceled: 0,
        queued: 0,
        processing: 0,
      }))
      .actionable(),
  },
} as const;
