import { Clock } from "lucide-react";

export type TimePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  label: string;
  error?: string;
};

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidTime(val: string): boolean {
  const match = val.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function TimePicker({ value = "", onChange, label, error }: TimePickerProps) {
  return (
    <label className={`field ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="HH:MM"
          maxLength={5}
          value={value}
          onChange={(e) => {
            const formatted = formatTimeInput(e.target.value);
            onChange?.(formatted);
          }}
          onBlur={() => {
            if (value && !isValidTime(value)) {
              onChange?.("");
            }
          }}
          style={{
            width: "100%",
            minHeight: "44px",
            padding: "0 38px 0 14px",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-muted)",
            color: "var(--text)",
            outline: "none",
            fontWeight: 500,
            fontSize: "14px",
            letterSpacing: "0.05em",
          }}
        />
        <Clock
          size={16}
          style={{
            position: "absolute",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
      </div>
      {error && (
        <small style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", color: "var(--danger)", fontWeight: 600 }}>
          {error}
        </small>
      )}
    </label>
  );
}
