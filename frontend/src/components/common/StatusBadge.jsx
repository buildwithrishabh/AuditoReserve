export function StatusBadge({ status, label }) {
  let mappedStatus = status;
  if (status === "student") {
    mappedStatus = "pending";
  } else if (status === "admin") {
    mappedStatus = "confirmed";
  }

  return (
    <span className={`status ${mappedStatus}`}>
      {label || status}
    </span>
  );
}
