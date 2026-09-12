export function ErrorState({
  title,
  message = "Please check the backend server and try again.",
  onRetry,
}) {
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

export function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
