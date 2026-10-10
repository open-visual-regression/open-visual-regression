export type ViteStats = {
  modules: { name: string; reasons?: { moduleName: string }[] }[];
};

export const readViteImporters = (stats: ViteStats): Map<string, string[]> =>
  new Map(
    stats.modules.map((module) => [
      module.name,
      (module.reasons ?? [])
        .map((reason) => reason.moduleName)
        .filter((moduleName) => moduleName !== module.name),
    ]),
  );
