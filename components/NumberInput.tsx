"use client";

import { useEffect, useState } from "react";

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  prefix,
  suffix,
  decimals = 0,
}: NumberInputProps) {
  const format = (n: number) => (decimals > 0 ? Number(n).toFixed(decimals) : String(Math.round(n)));

  const [inputValue, setInputValue] = useState<string>(() => format(value));

  useEffect(() => {
    setInputValue(format(value));
  }, [value, decimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    setInputValue(str);

    if (str.trim() === "" || str === "-" || str === "+" || str === "." || str === "-.") {
      // allow the user to clear / type signs/decimal without immediately clamping
      return;
    }

    const v = parseFloat(str);
    if (!isNaN(v)) {
      const clamped = Math.min(Math.max(v, min), max);
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim() === "") {
      setInputValue(format(value));
      return;
    }
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, min), max);
      setInputValue(format(clamped));
      onChange(clamped);
    } else {
      setInputValue(format(value));
    }
  };

  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.78rem",
          fontWeight: 500,
          color: "var(--text-secondary)",
          marginBottom: "0.3rem",
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid var(--maroon-border)",
          borderRadius: "5px",
          overflow: "hidden",
          backgroundColor: "var(--off-white)",
          transition: "border-color 0.15s",
        }}
        onFocus={() => { }}
      >
        {prefix && (
          <span
            style={{
              padding: "0.4rem 0.6rem",
              backgroundColor: "var(--maroon-faint)",
              borderRight: "1px solid var(--maroon-border)",
              fontSize: "0.82rem",
              fontFamily: "'DM Mono', monospace",
              color: "var(--maroon)",
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            padding: "0.4rem 0.6rem",
            fontSize: "0.88rem",
            fontFamily: "'DM Mono', monospace",
            backgroundColor: "transparent",
            color: "var(--text-primary)",
            minWidth: 0,
          }}
        />
        {suffix && (
          <span
            style={{
              padding: "0.4rem 0.6rem",
              backgroundColor: "var(--maroon-faint)",
              borderLeft: "1px solid var(--maroon-border)",
              fontSize: "0.82rem",
              fontFamily: "'DM Mono', monospace",
              color: "var(--maroon)",
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
