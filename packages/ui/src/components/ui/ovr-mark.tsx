interface OvrMarkProps {
  size?: number;
}

function OvrMark({ size = 22 }: OvrMarkProps) {
  const width = Math.max(3, Math.round(size / 6));
  return (
    <svg
      width={width}
      height={size}
      viewBox={`0 0 ${width} ${size}`}
      fill="none"
      aria-hidden="true"
    >
      <rect width="100%" height="100%" rx="0" fill="var(--ovr-accent-primary)" />
    </svg>
  );
}

export { OvrMark };
export type { OvrMarkProps };
