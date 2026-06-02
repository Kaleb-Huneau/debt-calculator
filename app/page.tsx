"use client";

import { useState, useMemo, useEffect } from "react";
import DebtChart from "@/components/DebtChart";
import SliderInput from "@/components/SliderInput";
import NumberInput from "@/components/NumberInput";
import SummaryCard from "@/components/SummaryCard";

export default function Home() {
    // Loan info

    const [interestBefore, setInterestBefore] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [loanBalance, setLoanBalance] = useState(0);
    const [interestRate, setInterestRate] = useState(6);
    const [interestDuringResidency, setInterestDuringResidency] = useState(0);
    const [residencyPeriod, setResidencyPeriod] = useState(0);
    // Fixed monthly expenses
    const [phone, setPhone] = useState(60);
    const [internet, setInternet] = useState(70);
    const [groceries, setGroceries] = useState(300);

    // Slider expenses
    const [rent, setRent] = useState(1750);
    const [car, setCar] = useState(600);
    const [fun, setFun] = useState(500);

    // Projection length in years
    const [years, setYears] = useState(4);
    const [yearsInput, setYearsInput] = useState(String(years));

    useEffect(() => {
        setYearsInput(String(years));
    }, [years]);

    // Annual tuition (paid at the start of each year)
    const [tuition, setTuition] = useState(30000);

    const monthlyExpenses = phone + internet + groceries + rent + car + fun;

    const handleRepaymentChange = (e: React.ChangeEvent<HTMLSelectElement, HTMLSelectElement>) => {
        const years = parseInt(e.target.value, 10);

        let acc = totalAmount;

        for (let i = 0; i < years; i++) {
            acc *= (1 + (interestRate / 100));
        }
        if (years == 0) {
            setInterestDuringResidency(0);
        } else {
            setInterestDuringResidency(acc - totalAmount);
        }
        setResidencyPeriod(years);
    };

    const projectionData = useMemo(() => {
        const months = years * 12;
        const monthlyRate = interestRate / 100 / 12;
        // start balance at the provided initial loan balance
        let balance = loanBalance;
        let cumulativeInterest = 0;
        let cumulativeExpenses = loanBalance;

        const data = [];
        let annualTotalDebtStep = 0;

        for (let m = 0; m <= months; m++) {
            const year = Math.floor(m / 12);
            const month = m % 12;

            // Tuition is paid (borrowed) at the start of each year (including m === 0)
            if (month === 0 && year < years && tuition > 0) {
                cumulativeExpenses += tuition;
                balance += tuition;
            }

            // Monthly expenses are added each month after the first snapshot (m > 0)
            if (m > 0) {
                cumulativeExpenses += monthlyExpenses;
                balance += monthlyExpenses;
            }

            // Interest accrues on the outstanding balance and is capitalized (compounds)
            const interestThisMonth = balance * monthlyRate;
            cumulativeInterest += interestThisMonth;
            balance += interestThisMonth;

            const label =
                month === 0
                    ? `Yr ${year}`
                    : month === 6
                        ? `Yr ${year}.5`
                        : null;

            const totalDebt = balance;
            if (month === 0) {
                annualTotalDebtStep = Math.round(totalDebt);
            }
            setTotalAmount(balance);
            data.push({
                month: m,
                label: label || "",
                showLabel: label !== null,
                totalDebt: Math.round(totalDebt),
                totalDebtAnnualStep: annualTotalDebtStep,
                cumulativeInterest: Math.round(cumulativeInterest),
                expenses: Math.round(cumulativeExpenses),
                total: Math.round(balance + cumulativeExpenses),
            });
        }
        setInterestBefore(cumulativeInterest);
        return data;
    }, [loanBalance, interestRate, monthlyExpenses, years, tuition]);

    const finalMonth = projectionData[projectionData.length - 1];

    // Repayment controls
    const [salary, setSalary] = useState(250000);
    const [repaymentMonthly, setRepaymentMonthly] = useState(4000);
    const [repaymentDelayYears, setRepaymentDelayYears] = useState(0);

    useEffect(() => {
        const monthlySalary = Math.max(0, Math.floor(salary / 12));
        setRepaymentMonthly((p) => Math.min(p, monthlySalary));
    }, [salary]);

    const repaymentProjectionData = useMemo(() => {
        const projectionMonths = years * 12;
        const repaymentWindowMonths = 8 * 12; // 8-year payback window after repayment starts
        const requestedStartMonth = repaymentDelayYears * 12;
        const startMonth = Math.min(requestedStartMonth, projectionMonths);
        const months = Math.max(projectionMonths, startMonth + repaymentWindowMonths);
        const monthlyRate = interestRate / 100 / 12;

        const data: any[] = [];

        // copy projection values for months before repayment starts
        for (let m = 0; m <= Math.min(startMonth - 1, months); m++) {
            const pd = projectionData[m];
            data.push({ ...pd, cumulativeRepayments: 0 });
        }

        // initialize from projection at repayment start (or construct initial values if starting immediately)
        let balance: number;
        let cumulativeInterest: number;
        let cumulativeExpenses: number;
        let cumulativeRepayments = 0;
        let annualStep = 0;

        if (startMonth === 0) {
            balance = totalAmount;
            cumulativeInterest = 0;
            cumulativeExpenses = 0;
            annualStep = Math.round(balance);
        } else {
            const prev = projectionData[Math.max(0, startMonth - 1)];
            balance = prev.totalDebt;
            cumulativeInterest = prev.cumulativeInterest;
            cumulativeExpenses = prev.expenses;
            annualStep = prev.totalDebtAnnualStep ?? Math.round(balance);
        }

        // simulate from startMonth to end
        for (let m = startMonth; m <= months; m++) {
            const year = Math.floor(m / 12);
            const month = m % 12;

            if (month === 0) annualStep = Math.round(balance);

            // snapshot at start of period
            data.push({
                month: m,
                label: month === 0 ? `Yr ${year}` : month === 6 ? `Yr ${year}.5` : "",
                showLabel: month === 0 || month === 6,
                totalDebt: Math.round(balance),
                totalDebtAnnualStep: annualStep,
                cumulativeInterest: Math.round(cumulativeInterest),
                expenses: Math.round(cumulativeExpenses),
                cumulativeRepayments: Math.round(cumulativeRepayments),
                total: Math.round(balance + cumulativeExpenses),
            });

            // subtract payment first (if in repayment period)
            if (repaymentMonthly > 0) {
                const paid = Math.min(repaymentMonthly, balance);
                cumulativeRepayments += paid;
                balance = Math.max(balance - paid, 0);
            }

            // then accrue interest on remaining balance
            const interestThisMonth = balance * monthlyRate;
            cumulativeInterest += interestThisMonth;
            balance += interestThisMonth;
        }

        return data;
    }, [projectionData, repaymentMonthly, repaymentDelayYears, years, interestRate, loanBalance, tuition]);

    // Payback period calculation (months from now until totalDebt reaches 0)
    const payoffIndex = repaymentProjectionData.findIndex((d) => d.totalDebt <= 0);
    let payoffText = "Not paid within projection";
    if (payoffIndex >= 0) {
        const yearsToPay = Math.floor(payoffIndex / 12);
        const monthsToPay = payoffIndex % 12;
        const yLabel = yearsToPay === 1 ? "year" : "years";
        const mLabel = monthsToPay === 1 ? "month" : "months";
        if (yearsToPay > 0 && monthsToPay > 0) {
            payoffText = `${yearsToPay} ${yLabel}, ${monthsToPay} ${mLabel}`;
        } else if (yearsToPay > 0) {
            payoffText = `${yearsToPay} ${yLabel}`;
        } else if (monthsToPay > 0) {
            payoffText = `${monthsToPay} ${mLabel}`;
        } else {
            payoffText = `Paid off now`;
        }
    }

    // Compute interest collected before repayment, during repayment, and total interest
    const startMonth = Math.min(repaymentDelayYears * 12, years * 12);
    const repayStartIndex = repaymentProjectionData.findIndex((d) => d.month >= startMonth);
    const finalRepayIndex = repaymentProjectionData.length - 1;
    const interestAtStart = repayStartIndex >= 0 ? (repaymentProjectionData[repayStartIndex]?.cumulativeInterest ?? 0) : 0;
    const interestAtEnd = finalRepayIndex >= 0 ? (repaymentProjectionData[finalRepayIndex]?.cumulativeInterest ?? 0) : 0;

    const interestBeforeRepayment = startMonth === 0 ? 0 : Math.round(projectionData[Math.min(startMonth - 1, projectionData.length - 1)]?.cumulativeInterest ?? 0);
    const totalInterest = Math.max(0, Math.round(interestAtEnd));
    const interestDuringRepayment = Math.max(0, Math.round(totalInterest - interestBeforeRepayment));

    // Compute years span for the repayment chart so it includes the full 8-year payback window
    const projectionMonths = years * 12;
    const requestedStartMonth = repaymentDelayYears * 12;
    const cappedStartMonth = Math.min(requestedStartMonth, projectionMonths);
    const repaymentWindowMonths = 8 * 12; // 8 years
    const repaymentMonthsHorizon = Math.max(projectionMonths, cappedStartMonth + repaymentWindowMonths);
    const repaymentChartYears = Math.ceil(repaymentMonthsHorizon / 12);

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "var(--off-white)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <header
                style={{
                    backgroundColor: "var(--maroon)",
                    color: "var(--white)",
                    padding: "0 2rem",
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "3px solid var(--maroon-dark)",
                    flexShrink: 0,
                }}
            >
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                    <h1
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            margin: 0,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Med School Debt Calculator
                    </h1>
                </div>

                {/* Projection Length Input */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                        style={{
                            fontSize: "0.75rem",
                            opacity: 0.8,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            fontWeight: 500,
                        }}
                    >
                        Projection:
                    </span>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <input
                            type="number"
                            min={1}
                            max={50}
                            value={yearsInput}
                            onChange={(e) => {
                                const str = e.target.value;
                                setYearsInput(str);
                                const v = parseInt(str || "", 10);
                                if (!isNaN(v)) setYears(Math.max(1, Math.min(50, v)));
                            }}
                            onBlur={() => {
                                if (yearsInput.trim() === "") {
                                    setYearsInput(String(years));
                                    return;
                                }
                                const v = parseInt(yearsInput, 10);
                                if (!isNaN(v)) {
                                    const clamped = Math.max(1, Math.min(50, v));
                                    setYears(clamped);
                                    setYearsInput(String(clamped));
                                } else {
                                    setYearsInput(String(years));
                                }
                            }}
                            style={{
                                width: "64px",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "rgba(255,255,255,0.12)",
                                color: "rgba(255,255,255,0.95)",
                                fontWeight: 700,
                                fontFamily: "'DM Sans', sans-serif",
                                textAlign: "center",
                                outline: "none",
                            }}
                        />
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                            yr
                        </span>
                    </div>
                </div>
            </header>

            <div
                style={{
                    display: "flex",
                    flex: 1,
                    gap: 0,
                    overflow: "hidden",
                    minHeight: "calc(100vh - 64px)",
                }}
            >
                <aside
                    style={{
                        width: "340px",
                        flexShrink: 0,
                        backgroundColor: "var(--white)",
                        borderRight: "1px solid var(--maroon-border)",
                        overflowY: "auto",
                        padding: "1.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                    }}
                >
                    <section>
                        <SectionHeader label="Student Loan" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <SliderInput
                                label="Initial Balance"
                                value={loanBalance}
                                onChange={setLoanBalance}
                                min={0}
                                max={500000}
                                step={500}
                            />
                            <NumberInput
                                label="Interest Rate"
                                value={interestRate}
                                onChange={setInterestRate}
                                min={0}
                                max={20}
                                step={0.1}
                                suffix="%"
                                decimals={1}
                            />
                        </div>
                    </section>

                    <Divider />

                    <section>
                        <SectionHeader label="Fixed Monthly Bills" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <SliderInput label="Phone Bill" value={phone} onChange={setPhone} min={0} max={500} step={1} />
                            <SliderInput label="Internet" value={internet} onChange={setInternet} min={0} max={300} step={1} />
                            <SliderInput label="Groceries" value={groceries} onChange={setGroceries} min={0} max={1500} step={10} />
                        </div>
                    </section>

                    <Divider />

                    <section>
                        <SectionHeader label="Variable Expenses" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <SliderInput label="Rent" value={rent} onChange={setRent} min={0} max={3000} step={50} />
                            <SliderInput label="Car" value={car} onChange={setCar} min={0} max={1500} step={25} />
                            <SliderInput label="Fun" value={fun} onChange={setFun} min={0} max={2000} step={25} />
                        </div>
                    </section>

                    <section>
                        <SectionHeader label="Annual Costs" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <NumberInput label="Tuition (per year)" value={tuition} onChange={setTuition} min={0} max={200000} prefix="$" />
                        </div>
                    </section>

                    <Divider />

                    <section>
                        <SectionHeader label="Monthly Breakdown" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            <LineItem label="Fixed Bills" value={phone + internet + groceries} />
                            <LineItem label="Rent" value={rent} />
                            <LineItem label="Car" value={car} />
                            <LineItem label="Fun" value={fun} />
                            <LineItem label="Tuition / Year" value={tuition} />
                            <div style={{ borderTop: "1.5px solid var(--maroon-border)", marginTop: "0.4rem", paddingTop: "0.4rem" }} />
                        </div>
                    </section>
                </aside>

                <main style={{ flex: 1, padding: "1.5rem 2rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                        <SummaryCard label={`Total Spent in ${years} yr${years > 1 ? "s" : ""}`} value={finalMonth.expenses} color="var(--maroon)" />
                        <SummaryCard label={`Interest Collected in ${years} yr${years > 1 ? "s" : ""}`} value={finalMonth.cumulativeInterest} color="var(--maroon-light)" />
                        <SummaryCard label="Total Debt" value={finalMonth.totalDebt} color={finalMonth.totalDebt === 0 ? "#2d6a3f" : "var(--maroon-dark)"} note={finalMonth.totalDebt === 0 ? "Paid off! 🎉" : undefined} />
                    </div>

                    <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--maroon-border)", borderRadius: "8px", padding: "1.5rem", flex: 1, minHeight: "400px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 600, margin: 0, color: "var(--maroon-dark)" }}>{years}-Year Financial Projection</h2>
                            <div style={{ display: "flex", gap: "1.25rem" }}>
                                <LegendDot color="#6B0F1A" label="Expenses" />
                                <LegendDot color="#C5586B" label="Interest Paid" />

                            </div>
                        </div>
                        <DebtChart data={projectionData} years={years} />
                    </div>

                    <Divider />

                    <section>
                        <SectionHeader label="Repayment Plan" />
                        <div style={{ display: "flex", gap: "1.25rem" }}>
                            <div style={{ width: "340px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>


                                <SliderInput label="Salary (annual after tax)" value={salary} onChange={setSalary} min={0} max={800000} step={1000} />

                                <SliderInput label="Monthly Payment" value={repaymentMonthly} onChange={setRepaymentMonthly} min={0} max={Math.max(0, Math.floor(salary / 12))} step={25} />
                            </div>

                            <div style={{ flex: 1, backgroundColor: "var(--white)", border: "1px solid var(--maroon-border)", borderRadius: "8px", padding: "1rem" }}>
                                <DebtChart data={repaymentProjectionData} years={repaymentChartYears} debtOnly />
                            </div>
                        </div>
                    </section>
                    <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--maroon-border)", borderRadius: "8px", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--maroon-dark)", marginBottom: "0.25rem" }}>Payback Period</div>
                            <div style={{ fontSize: "1.05rem", fontFamily: "'DM Mono', monospace", fontWeight: 800, color: "var(--text-primary)" }}>{payoffText}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Based on selected monthly payment and start delay</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Remaining balance</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "var(--maroon-dark)" }}>${(repaymentProjectionData[repaymentProjectionData.length - 1]?.totalDebt ?? 0).toLocaleString()}</div>


                        </div>
                    </div>

                    <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem" }}>
                        <div style={{ flex: 1, backgroundColor: "var(--white)", border: "1px solid var(--maroon-border)", borderRadius: "8px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--maroon-dark)", marginBottom: "0.25rem" }}>Interest Summary</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Breakdown of interest before & during repayment

                                    <div style={{ marginTop: "1em" }}>
                                        <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginTop: "2em", marginRight: "2em" }}>When to start paying off the loans (might be hard during residency)</label>

                                        <select value={residencyPeriod} onChange={(e) => handleRepaymentChange(e)} style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--maroon-border)", background: "var(--white)" }}>
                                            <option value={0}>Immediately</option>
                                            <option value={1}>After 1 year</option>
                                            <option value={2}>After 2 years</option>
                                            <option value={3}>After 3 years</option>
                                            <option value={4}>After 4 years</option>
                                        </select>

                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "1.5rem" }}>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Before repayment</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>${interestBefore.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>During repayment</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>${interestDuringRepayment.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>During residency</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>${interestDuringResidency.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total interest</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "var(--maroon-dark)" }}>${(interestBefore + interestDuringRepayment + interestDuringResidency).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem" }}>
                        <div style={{ flex: 1, backgroundColor: "var(--white)", border: "1px solid var(--maroon-border)", borderRadius: "8px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--maroon-dark)", marginBottom: "0.25rem" }}>Loan Totals</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Original Cost Plus all Interest

                                </div>

                                <div style={{ display: "flex", gap: "1.5rem" }}>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Principal</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>${finalMonth.expenses.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Interest</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>${(interestBefore + interestDuringRepayment + interestDuringResidency).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Paid</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "var(--maroon-dark)" }}>${(finalMonth.expenses + interestBefore + interestDuringRepayment + interestDuringResidency).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, fontFamily: "'DM Mono', monospace" }}>* Projections assume fixed monthly expenses and constant interest rate. Car and fun values represent estimates. This is not financial advice.</p>
                </main>
            </div>
        </div>
    );
}

function SectionHeader({ label }: { label: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
            <span style={{ display: "block", width: "3px", height: "14px", backgroundColor: "var(--maroon)", borderRadius: "2px", flexShrink: 0 }} />
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--maroon)", margin: 0 }}>{label}</h3>
        </div>
    );
}

function Divider() {
    return <div style={{ height: "1px", backgroundColor: "var(--maroon-border)", opacity: 0.5 }} />;
}

function LineItem({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: bold ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: bold ? 600 : 400 }}>{label}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", color: bold ? "var(--maroon)" : "var(--text-secondary)", fontWeight: bold ? 600 : 400 }}>${value.toLocaleString()}</span>
        </div>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{label}</span>
        </div>
    );
}
