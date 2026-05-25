import { Loader2 } from "lucide-react";

export function SkeletonGrid() {
  return (
    <div className="auditorium-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="skeleton-card" key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="table-card">
      <div style={{ padding: "20px", display: "grid", gap: "12px" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            className="skeleton-card"
            key={i}
            style={{ height: "48px", borderRadius: "6px" }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="detail-grid">
      <div className="skeleton-card" style={{ height: "400px" }} />
      <div className="skeleton-card" style={{ height: "400px" }} />
    </div>
  );
}

export type FullPageStateProps = {
  title: string;
  message: string;
  action?: React.ReactNode;
  showSpinner?: boolean;
};

export function FullPageState({
  title,
  message,
  action,
  showSpinner = true,
}: FullPageStateProps) {
  return (
    <div className="full-state">
      {showSpinner && (
        <Loader2
          className="animate-spin"
          size={36}
          style={{ color: "var(--primary)", marginBottom: "16px" }}
        />
      )}
      <h1>{title}</h1>
      <p>{message}</p>
      {action && <div style={{ marginTop: "16px" }}>{action}</div>}
    </div>
  );
}
