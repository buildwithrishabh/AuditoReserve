export function StatusBadge({ status, label }) {
  return (
    <span className={`status ${status}`}>
      {label || status}
    </span>
  );
}

