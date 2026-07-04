export const formatFacetValueLabel = (selectedLabels: string[]): string => {
  if (selectedLabels.length === 0) {
    return "any";
  }

  const [label] = selectedLabels;

  if (label) {
    return label;
  }

  return `${selectedLabels.length} selected`;
};
