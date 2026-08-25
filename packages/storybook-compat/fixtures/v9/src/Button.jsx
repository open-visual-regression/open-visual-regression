const TONES = {
  primary: "#2563eb",
  danger: "#dc2626",
};

export const Button = ({ label, tone = "primary" }) => (
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
