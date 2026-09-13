export type OvrStoryParameterViewport =
  | string
  | { browser?: string; width: number; height?: number };

export type OvrStoryParameters = {
  viewports?: OvrStoryParameterViewport[];
  diffThreshold?: number;
  skip?: boolean;
};
