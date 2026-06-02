"use client";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  month: number;
  label: string;
  showLabel: boolean;
  totalDebt: number;
  cumulativeInterest: number;
  expenses: number;
  totalDebtAnnualStep?: number;
  total: number;
  cumulativeRepayments?: number;
}

interface DebtChartProps {
  data: DataPoint[];
  years: number;
  debtOnly?: boolean;
}

function formatDollar(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

const CustomTooltip = ({ active, payload, label, debtOnly }: any) => {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0]?.payload as DataPoint;
  const month = d.month;
  const yr = Math.floor(month / 12);
  const mo = month % 12;
  const timeLabel = mo === 0 ? `Year ${yr}` : `Year ${yr}, Month ${mo}`;

  return (
    <div
      style={{
        backgroundColor: "var(--maroon-dark)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "6px",
        padding: "0.75rem 1rem",
        fontSize: "0.78rem",
        color: "var(--white)",
        boxShadow: "0 4px 16px rgba(74,11,18,0.3)",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: "0.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          paddingBottom: "0.4rem",
          fontFamily: "'Playfair Display', serif",
        }}
      >
        {timeLabel}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {debtOnly ? (
          <>
            <TooltipRow color="#FAFAF8" label="Remaining Debt" value={d.totalDebt} bold />
            {typeof d.cumulativeRepayments === "number" ? (
              <TooltipRow color="#6B0F1A" label="Cumulative Repayments" value={d.cumulativeRepayments} />
            ) : null}
          </>
        ) : (
          <>
            <TooltipRow color="#6B0F1A" label="Expenses" value={d.expenses} />
            <TooltipRow color="#C5586B" label="Interest" value={d.cumulativeInterest} />
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.15)",
                marginTop: "0.2rem",
                paddingTop: "0.3rem",
              }}
            >
              <TooltipRow color="#FAFAF8" label="Expenses + Interest" value={d.totalDebt} bold />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function TooltipRow({
  color,
  label,
  value,
  bold,
}: {
  color: string;
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "1.5rem",
        fontWeight: bold ? 600 : 400,
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.75)" }}>{label}</span>
      <span style={{ color, fontFamily: "'DM Mono', monospace" }}>
        ${value.toLocaleString()}
      </span>
    </div>
  );
}

export default function DebtChart({ data, years, debtOnly = false }: DebtChartProps) {
  const hasAnnualStep = data.some((d) => typeof d.totalDebtAnnualStep === "number");
  // Only label year boundaries
  const tickFormatter = (val: number) => {
    if (val % 12 === 0) return `Yr ${val / 12}`;
    return "";
  };

  // Generate ticks at year boundaries
  const ticks = Array.from({ length: years + 1 }, (_, i) => i * 12);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
      >
        <defs>
          <pattern
            id="gridPattern"
            patternUnits="userSpaceOnUse"
            width="40"
            height="40"
          />
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--maroon-border)"
          opacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          ticks={ticks}
          tickFormatter={tickFormatter}
          tick={{
            fontSize: 11,
            fill: "var(--text-muted)",
            fontFamily: "'DM Mono', monospace",
          }}
          axisLine={{ stroke: "var(--maroon-border)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatDollar}
          tick={{
            fontSize: 11,
            fill: "var(--text-muted)",
            fontFamily: "'DM Mono', monospace",
          }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip content={<CustomTooltip debtOnly={debtOnly} />} />

        {debtOnly ? (
          <Area
            type="step"
            dataKey="totalDebt"
            stroke="#111111"
            strokeWidth={0}
            fill="#111111"
            fillOpacity={0.12}
            dot={false}
            isAnimationActive={false}
            name="Remaining Debt"
          />
        ) : (
          <>
            <Area
              type="monotone"
              dataKey="expenses"
              stackId="1"
              stroke="#6B0F1A"
              strokeWidth={2}
              fill="#6B0F1A"
              fillOpacity={0.85}
              isAnimationActive={false}
              name="Expenses"
            />
            <Area
              type="monotone"
              dataKey="cumulativeInterest"
              stackId="1"
              stroke="#C5586B"
              strokeWidth={2}
              fill="#C5586B"
              fillOpacity={0.85}
              isAnimationActive={false}
              name="Interest"
            />

          </>
        )}

      </AreaChart>
    </ResponsiveContainer>
  );
}
