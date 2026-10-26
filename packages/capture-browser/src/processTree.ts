import { readdir, readFile } from "node:fs/promises";

export type ProcessTreeUsage = {
  /** Live descendant processes, zombies excluded. */
  processes: number;
  /** Descendants that exited but were never reaped. */
  zombies: number;
  /** Resident memory of the live descendants, in bytes. */
  rssBytes: number;
  /** Pids of the live descendants. */
  pids: number[];
};

type ProcStat = { pid: number; ppid: number; pgrp: number; state: string };

// The comm field is wrapped in parentheses and may itself contain spaces or parentheses.
const parseStat = (pid: number, stat: string): ProcStat | null => {
  const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
  const state = fields[0];
  const ppid = Number(fields[1]);
  const pgrp = Number(fields[2]);
  return state && Number.isInteger(ppid) && Number.isInteger(pgrp)
    ? { pid, ppid, pgrp, state }
    : null;
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

// Returns null where /proc is unavailable (macOS, Windows).
const readAllStats = async (): Promise<ProcStat[] | null> => {
  const entries = await readdir("/proc").catch(() => null);
  if (!entries) {
    return null;
  }

  const stats = await Promise.all(
    entries.filter((name) => /^\d+$/.test(name)).map((name) => readStat(Number(name))),
  );
  return stats.filter((stat) => stat !== null);
};

const findDescendants = (stats: ProcStat[], rootPid: number): ProcStat[] => {
  const children = new Map<number, ProcStat[]>();
  for (const stat of stats) {
    children.set(stat.ppid, [...(children.get(stat.ppid) ?? []), stat]);
  }

  const descendants: ProcStat[] = [];
  const pending = [rootPid];
  while (pending.length > 0) {
    for (const child of children.get(pending.pop()!) ?? []) {
      descendants.push(child);
      pending.push(child.pid);
    }
  }
  return descendants;
};

/**
 * Sums the descendants of `rootPid` from /proc, so the worker can report the browsers it
 * launched. Returns null where /proc is unavailable (macOS, Windows).
 */
export const readProcessTree = async (rootPid: number): Promise<ProcessTreeUsage | null> => {
  const stats = await readAllStats();
  if (!stats) {
    return null;
  }

  const descendants = findDescendants(stats, rootPid);
  const live = descendants.filter(({ state }) => state !== "Z");
  const rss = await Promise.all(live.map(({ pid }) => readRssBytes(pid)));

  return {
    processes: live.length,
    zombies: descendants.length - live.length,
    rssBytes: rss.reduce((total, bytes) => total + bytes, 0),
    pids: live.map(({ pid }) => pid),
  };
};

/**
 * Pids of the live processes that descend from `rootPid` or belong to process group `pgid`. A child
 * stays in the group after its parent exits, and one that left the group stays a descendant, so
 * both are needed to find every process of a browser.
 * Returns null where /proc is unavailable (macOS, Windows).
 */
export const listProcessFamily = async (
  rootPid: number,
  pgid = rootPid,
): Promise<number[] | null> => {
  const stats = await readAllStats();
  if (!stats) {
    return null;
  }

  const members = [
    ...findDescendants(stats, rootPid),
    ...stats.filter(({ pid, pgrp }) => pid === rootPid || pgrp === pgid),
  ];
  return [...new Set(members.filter(({ state }) => state !== "Z").map(({ pid }) => pid))];
};
