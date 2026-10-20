import React from "react";
import { AlertCircle } from "lucide-react";

export const TextField = React.forwardRef(
  ({ label, error, rightElement, ...props }, ref) => {
    return (
      <label className={`field ${error ? "has-error" : ""}`}>
        {label && <span>{label}</span>}
        <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
          <input
            ref={ref}
            {...props}
            style={{
              paddingRight: rightElement ? "42px" : undefined,
              ...props.style,
            }}
          />
          {rightElement && (
            <div
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {rightElement}
            </div>
          )}
        </div>
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
