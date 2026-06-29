import { type BuildSchema } from "@ovr/api/contracts/builds";
import { BuildsTable } from "./BuildsTable";
import { NoBuildsSection } from "./NoBuildsSection";

type BuildsSectionProps = {
  builds: BuildSchema[];
  search?: string;
};

export const BuildsSection = ({ builds, search }: BuildsSectionProps) => (
  <div className="flex flex-col">
    {builds.length === 0 && !search ? (
      <NoBuildsSection />
    ) : (
      <BuildsTable data={builds} search={search} />
    )}
  </div>
);
