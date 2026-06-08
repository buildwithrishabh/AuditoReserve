import type { BookingStatus } from "../../types";

export type StatusTabsProps = {
  value: BookingStatus | "all";
  onChange: (value: BookingStatus | "all") => void;
  includeAll?: boolean;
};

export function StatusTabs({
  value,
  onChange,
  includeAll = false,
}: StatusTabsProps) {
  const tabs: Array<BookingStatus | "all"> = includeAll
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
