export type ErrorStateProps = {
  title: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title,
  message = "Please check the backend server and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="empty-state error-state">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button
          className="button primary"
          type="button"
          onClick={onRetry}
          style={{ marginTop: "16px" }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
