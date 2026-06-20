import { SplitPanes, type SplitPanesProps } from "./SplitPanes";

export type ComparisonViewProps = SplitPanesProps;

export const ComparisonView = (props: ComparisonViewProps) => <SplitPanes {...props} />;
