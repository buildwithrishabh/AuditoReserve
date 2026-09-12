export function StatusTabs({
  value,
  onChange,
  includeAll = false,
}) {
  const tabs = includeAll
    ? ["all", "pending", "approved", "confirmed", "cancelled"]
    : ["pending", "approved", "confirmed", "cancelled"];

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={value === tab ? "active" : ""}
          type="button"
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
export default StatusTabs;
