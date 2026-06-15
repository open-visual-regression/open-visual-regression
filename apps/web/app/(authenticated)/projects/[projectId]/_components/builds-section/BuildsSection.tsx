import { type BuildSchema } from "@ovr/api/contracts/builds";
import { BuildsTable } from "./BuildsTable";
import { NoBuildsSection } from "./NoBuildsSection";

type BuildsSectionProps = {
  builds: BuildSchema[];
};

export const BuildsSection = ({ builds }: BuildsSectionProps) => (
  <div className="flex flex-col">
    {builds.length === 0 ? <NoBuildsSection /> : <BuildsTable data={builds} />}
  </div>
);
