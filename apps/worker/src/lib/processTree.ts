import { readdir, readFile } from "node:fs/promises";

export type ProcessTreeUsage = {
  /** Live descendant processes, zombies excluded. */
  processes: number;
  /** Descendants that exited but were never reaped. */
  zombies: number;
  /** Resident memory of the live descendants, in bytes. */
  rssBytes: number;
};

type ProcStat = { pid: number; ppid: number; state: string };

// The comm field is wrapped in parentheses and may itself contain spaces or parentheses.
const parseStat = (pid: number, stat: string): ProcStat | null => {
  const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
  const state = fields[0];
  const ppid = Number(fields[1]);
  return state && Number.isInteger(ppid) ? { pid, ppid, state } : null;
};

const readStat = async (pid: number): Promise<ProcStat | null> => {
  const stat = await readFile(`/proc/${pid}/stat`, "utf8").catch(() => null);
  return stat ? parseStat(pid, stat) : null;
};

const readRssBytes = async (pid: number): Promise<number> => {
  const status = await readFile(`/proc/${pid}/status`, "utf8").catch(() => "");
  const match = /^VmRSS:\s+(\d+) kB$/m.exec(status);
  return match ? Number(match[1]) * 1024 : 0;
};

/**
 * Sums the descendants of `rootPid` from /proc, so the worker can report the browsers it
 * launched. Returns null where /proc is unavailable (macOS, Windows).
 */
export const readProcessTree = async (rootPid: number): Promise<ProcessTreeUsage | null> => {
  const entries = await readdir("/proc").catch(() => null);
  if (!entries) {
    return null;
  }

  const stats = await Promise.all(
    entries.filter((name) => /^\d+$/.test(name)).map((name) => readStat(Number(name))),
  );

  const children = new Map<number, ProcStat[]>();
  for (const stat of stats) {
    if (stat) {
      children.set(stat.ppid, [...(children.get(stat.ppid) ?? []), stat]);
    }
  }

  const descendants: ProcStat[] = [];
  const pending = [rootPid];
  while (pending.length > 0) {
    for (const child of children.get(pending.pop()!) ?? []) {
      descendants.push(child);
      pending.push(child.pid);
    }
  }

  const live = descendants.filter(({ state }) => state !== "Z");
  const rss = await Promise.all(live.map(({ pid }) => readRssBytes(pid)));

  return {
    processes: live.length,
    zombies: descendants.length - live.length,
    rssBytes: rss.reduce((total, bytes) => total + bytes, 0),
  };
};
