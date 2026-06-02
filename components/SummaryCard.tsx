"use client";

interface SummaryCardProps {
  label: string;
  value: number;
  color: string;
  note?: string;
}

export default function SummaryCard({ label, value, color, note }: SummaryCardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--white)",
        border: "1px solid var(--maroon-border)",
        borderTop: `3px solid ${color}`,
        borderRadius: "8px",
        padding: "1rem 1.25rem",
      }}
    >
      <div
        style={{
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          fontWeight: 600,
          marginBottom: "0.4rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "1.5rem",
          fontWeight: 500,
          color: color,
          lineHeight: 1,
        }}
      >
        ${value.toLocaleString()}
      </div>
      {note && (
        <div
          style={{
            fontSize: "0.72rem",
            color: color,
            marginTop: "0.35rem",
            fontWeight: 500,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}
