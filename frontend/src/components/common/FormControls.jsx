import React from "react";
import { AlertCircle } from "lucide-react";

export const TextField = React.forwardRef(
  ({ label, error, ...props }, ref) => {
    return (
      <label className={`field ${error ? "has-error" : ""}`}>
        <span>{label}</span>
        <input ref={ref} {...props} />
        {error && (
          <small style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
            <AlertCircle size={12} />
            {error}
          </small>
        )}
      </label>
    );
  }
);

TextField.displayName = "TextField";

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="error-box">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}

export function FormSuccess({ message }) {
  if (!message) return null;
  return <div className="success-box">{message}</div>;
}
