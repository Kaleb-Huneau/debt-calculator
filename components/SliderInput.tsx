"use client";

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}

export default function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 10,
}: SliderInputProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const pctSafe = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.5rem",
        }}
      >
        <label
          style={{
            fontSize: "0.82rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.88rem",
            fontWeight: 500,
            color: "var(--maroon)",
          }}
        >
          ${value.toLocaleString()}
        </span>
      </div>
      <div style={{ position: "relative" }}>
        {/* Thumb indicator centered on the track (no floating price) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: `${pctSafe}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 3,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: "var(--maroon)",
              borderRadius: "50%",
              border: "3px solid var(--white)",
              boxShadow: "0 4px 10px rgba(74,11,18,0.18)",
            }}
          />
        </div>

        {/* Track background (shows unfilled portion) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            height: "4px",
            width: "100%",
            backgroundColor: "var(--maroon-border)",
            borderRadius: "2px",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            height: "4px",
            width: `${pctSafe}%`,
            backgroundColor: "var(--maroon)",
            borderRadius: "2px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ position: "relative", zIndex: 2, background: "transparent", opacity: 0, width: "100%", height: 32, margin: 0, padding: 0, cursor: "pointer" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.2rem",
        }}
      >
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>
          ${min.toLocaleString()}
        </span>
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>
          ${max.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
