// Deliberately styled with inline styles and no web fonts so that the rendered
// output is byte-identical across Storybook majors — these stories are captured
// and compared in the compatibility suite.
export type ButtonProps = {
  label: string;
  tone?: "primary" | "danger";
};

const TONES = {
  primary: "#2563eb",
  danger: "#dc2626",
} as const;

export const Button = ({ label, tone = "primary" }: ButtonProps) => (
  <button
    type="button"
    data-testid="fixture-button"
    style={{
      width: 200,
      height: 48,
      border: "none",
      borderRadius: 4,
      background: TONES[tone],
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: 16,
    }}
  >
    {label}
  </button>
);
