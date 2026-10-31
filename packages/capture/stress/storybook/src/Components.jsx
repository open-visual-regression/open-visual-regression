export const Button = ({ label, secondary }) => (
  <button className={secondary ? "btn secondary" : "btn"}>{label}</button>
);

export const Form = ({ fields }) => (
  <form className="card" style={{ maxWidth: 420, display: "grid", gap: 12 }}>
    {Array.from({ length: fields }, (_, i) => (
      <label key={i} style={{ display: "grid", gap: 4 }}>
        Field {i + 1}
        <input defaultValue={`Value ${i + 1}`} style={{ padding: 6 }} />
      </label>
    ))}
    <Button label="Submit" />
  </form>
);

export const CardGrid = ({ count }) => (
  <div className="grid">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="card">
        <h4 style={{ margin: 0 }}>Project {i + 1}</h4>
        <p>
          Updated by user {i % 7} with {i * 3} changes across {i % 5} files.
        </p>
        <Button label="Open" secondary />
      </div>
    ))}
  </div>
);

export const Table = ({ rows }) => (
  <table>
    <thead>
      <tr>
        {["ID", "Name", "Status", "Owner", "Updated", "Amount"].map((h) => (
          <th key={h}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i}>
          <td>{1000 + i}</td>
          <td>Item {i}</td>
          <td>{["Open", "Closed", "Pending"][i % 3]}</td>
          <td>user{i % 9}</td>
          <td>
            2026-0{(i % 9) + 1}-1{i % 9}
          </td>
          <td>${(i * 37.5).toFixed(2)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const Article = ({ paragraphs }) => (
  <article style={{ maxWidth: 680 }}>
    <h1>Release notes</h1>
    {Array.from({ length: paragraphs }, (_, i) => (
      <p key={i}>
        Paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
        exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </p>
    ))}
  </article>
);

export const SvgChart = ({ points }) => (
  <svg width="480" height="240" style={{ border: "1px solid #e5e7eb" }}>
    <polyline
      fill="none"
      stroke="#4f46e5"
      strokeWidth="2"
      points={Array.from(
        { length: points },
        (_, i) => `${(i * 470) / (points - 1) + 5},${120 + Math.sin(i / 2) * 90}`,
      ).join(" ")}
    />
  </svg>
);
