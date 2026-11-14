export const formatFacetValueLabel = (selectedLabels: string[]): string => {
  if (selectedLabels.length === 0) {
    return "Any";
  }

  if (selectedLabels.length > 1) {
    return `${selectedLabels.length} selected`;
  }

  const [label] = selectedLabels;
  return label ?? "Any";
};
