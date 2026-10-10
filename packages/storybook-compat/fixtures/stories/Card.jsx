import { TONES } from "./tones";

export const Card = ({ children }) => (
  <div
    data-testid="fixture-card"
    style={{
      width: 200,
      padding: 16,
      border: `2px solid ${TONES.primary}`,
      fontFamily: "monospace",
    }}
  >
    {children}
  </div>
);
