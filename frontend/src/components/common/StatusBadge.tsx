import type { BookingStatus } from "../../types";

export type StatusBadgeProps = {
  status: BookingStatus | "student" | "admin";
  label?: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  let mappedStatus = status as string;
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
