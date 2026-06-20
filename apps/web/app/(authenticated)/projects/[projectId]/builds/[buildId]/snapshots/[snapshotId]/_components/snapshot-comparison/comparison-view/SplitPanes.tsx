import { BaselinePane } from "./BaselinePane";
import { NewPane } from "./NewPane";

export type SplitPanesProps = {
  baselineImagePath: string | null;
  baselineAlt: string;
  newImagePath: string | null;
  newAlt: string;
  diffImagePath: string | null;
};

export const SplitPanes = ({
  baselineImagePath,
  baselineAlt,
  newImagePath,
  newAlt,
  diffImagePath,
}: SplitPanesProps) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <BaselinePane imagePath={baselineImagePath} alt={baselineAlt} />
    <NewPane imagePath={newImagePath} diffImagePath={diffImagePath} alt={newAlt} />
  </div>
);
