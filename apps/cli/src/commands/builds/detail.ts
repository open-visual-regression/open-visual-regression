export type BuildDetailFields = {
  id: string;
  status: string;
  branch: string;
  commitSha: string;
  project: string;
  name: string | null;
  author: string | null;
  createdAt: string;
  errorMessage: string | null;
  canceledBy: string | null;
};

export const formatBuildDetail = (build: BuildDetailFields): string => {
  const rows: [string, string][] = [
    ["Build", build.id],
    ["Status", build.status],
    ["Branch", build.branch],
    ["Commit", build.commitSha],
    ["Project", build.project],
    ["Name", build.name ?? ""],
    ["Author", build.author ?? ""],
    ["Created", build.createdAt],
  ];

  if (build.errorMessage) {
    rows.push(["Error", build.errorMessage]);
  }

  if (build.canceledBy) {
    rows.push(["Canceled by", build.canceledBy]);
  }

  const labelWidth = Math.max(...rows.map(([label]) => label.length));

  return rows.map(([label, value]) => `${`${label}:`.padEnd(labelWidth + 1)} ${value}`).join("\n");
};
