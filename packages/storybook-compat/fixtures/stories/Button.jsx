import "./Button.css";
import { TONES } from "./tones";

export const Button = ({ label, tone = "primary" }) => (
  <button
    type="button"
    className="fixture-button"
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
