export const formatFacetValueLabel = (selectedLabels: string[]): string => {
  if (selectedLabels.length === 0) {
    return "any";
  }

  if (selectedLabels.length === 1) {
    return selectedLabels[0]!;
  }

  return `${selectedLabels.length} selected`;
};
