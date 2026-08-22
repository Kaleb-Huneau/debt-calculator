"use client";

import { useState, useMemo, useEffect } from "react";
import DebtChart from "@/components/DebtChart";
import SliderInput from "@/components/SliderInput";
import NumberInput from "@/components/NumberInput";
import SummaryCard from "@/components/SummaryCard";
import React from "react";
export default function Home() {
    // Loan info

    const [interestBefore, setInterestBefore] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [loanBalance, setLoanBalance] = useState(0);
    const [osapLoanBalance, setOsapLoanBalance] = useState(15000);
    const [osapGrants, setOsapGrants] = useState(7000);
    const [interestRate, setInterestRate] = useState(4.2);
    const [interestDuringResidency, setInterestDuringResidency] = useState(0);
    const [residencyPeriod, setResidencyPeriod] = useState(4);
    const [interestDuringRepayment, setInterestDuringRepayment] = useState(0);
    // Fixed monthly expenses
    const [phone, setPhone] = useState(60);
    const [utilities, setUtilities] = useState(110);
    const [internet, setInternet] = useState(70);
    const [groceries, setGroceries] = useState(300);
    const [gym, setGym] = useState(120);
    const [disabilityBenefit, setDisabilityBenefit] = useState(308);
    const [income, setIncome] = useState(0);

    // Slider expenses
    const [rent, setRent] = useState(2200);
    const [car, setCar] = useState(350);
    const [fun, setFun] = useState(500);

    // Projection length in years
    const [years, setYears] = useState(4);
    const [yearsInput, setYearsInput] = useState(String(years));

    useEffect(() => {
        setYearsInput(String(years));
    }, [years]);

    // Annual tuition (paid at the start of each year)
    const [tuition, setTuition] = useState(30000);
    // One-time expenses (three separate amount + year fields)
    const [oneTimeExpense, setOneTimeExpense] = useState(0);
    const [oneTimeExpenseYear, setOneTimeExpenseYear] = useState(1);
    const [oneTimeExpense2, setOneTimeExpense2] = useState(0);
    const [oneTimeExpense2Year, setOneTimeExpense2Year] = useState(1);
    const [oneTimeExpense3, setOneTimeExpense3] = useState(0);
    const [oneTimeExpense3Year, setOneTimeExpense3Year] = useState(1);

    const monthlyExpenses = phone + utilities + internet + groceries + rent + car + fun + gym - disabilityBenefit - income;

    const handleRepaymentChange = (e: React.ChangeEvent<HTMLSelectElement, HTMLSelectElement>) => {
        const years = parseInt(e.target.value, 10);
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

        for (let m = 1; m <= months; m++) {
            const year = Math.floor(m / 12);
            const month = m % 12;

            // Tuition is paid (borrowed) at the start of each year (including m === 0)
            if (month === 1 && year < years && tuition > 0) {
                cumulativeExpenses += tuition;
                cumulativeExpenses -= osapGrants;
                balance -= osapGrants;
                balance += tuition;
            }

            // One-time expenses occur at the start of the selected year (human year 1..N -> code year 0..N-1)
            if (month === 1) {
                if (year == 0) {
                    cumulativeExpenses += 24000;
                    balance += 20000;
                }
                if (oneTimeExpense > 0 && year === Math.max(0, oneTimeExpenseYear - 1)) {
                    cumulativeExpenses += oneTimeExpense;
                    balance += oneTimeExpense;
                }
                if (oneTimeExpense2 > 0 && year === Math.max(0, oneTimeExpense2Year - 1)) {
                    cumulativeExpenses += oneTimeExpense2;
                    balance += oneTimeExpense2;
                }
                if (oneTimeExpense3 > 0 && year === Math.max(0, oneTimeExpense3Year - 1)) {
                    cumulativeExpenses += oneTimeExpense3;
                    balance += oneTimeExpense3;
                }
            }


            // Monthly expenses are added each month after the first snapshot (m > 0)
            if (m > 0) {
                cumulativeExpenses += monthlyExpenses;
                balance += monthlyExpenses;
            }

            // Interest accrues on the outstanding balance
            const interestThisMonth = (balance - (osapLoanBalance * year)) * monthlyRate;
            cumulativeInterest += interestThisMonth;


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

        return data;
    }, [loanBalance, interestRate, monthlyExpenses, years, tuition, osapLoanBalance, osapGrants, oneTimeExpense, oneTimeExpenseYear, oneTimeExpense2, oneTimeExpense2Year, oneTimeExpense3, oneTimeExpense3Year, gym, disabilityBenefit]);


    useEffect(() => {
        let acc = finalMonth.expenses * residencyPeriod * (interestRate / 100);
        if (residencyPeriod == 0) {
            setInterestDuringResidency(0);
        } else {
            setInterestDuringResidency(acc);
        }
    })

    // Update derived states from the projection data in an effect (avoid setState inside useMemo)
    useEffect(() => {
        if (!projectionData || projectionData.length === 0) {
            setTotalAmount(0);
            setInterestBefore(0);
            return;
        }
        const last = projectionData[projectionData.length - 1];
        setTotalAmount(last?.totalDebt ?? 0);
        setInterestBefore(last?.cumulativeInterest ?? 0);
    }, [projectionData]);

    // keep selected one-time year(s) within the projection range
    useEffect(() => {
        setOneTimeExpenseYear((prev) => Math.min(prev, years));
        setOneTimeExpense2Year((prev) => Math.min(prev, years));
        setOneTimeExpense3Year((prev) => Math.min(prev, years));
    }, [years]);

    const finalMonth = projectionData[projectionData.length - 1];

    // Repayment controls
    const [salary, setSalary] = useState(200000);
    const [repaymentMonthly, setRepaymentMonthly] = useState(10000);
    const [repaymentDelayYears, setRepaymentDelayYears] = useState(0);

    useEffect(() => {
        const monthlySalary = Math.max(0, Math.floor(salary / 12));
        setRepaymentMonthly((p) => Math.min(p, monthlySalary));
    }, [salary]);

    const repaymentProjectionData = useMemo(() => {
        // determine repayment horizon (months): ensure we cover projection and an 8-year payback window after start
        const projectionMonths = years * 12;
        const requestedStartMonth = repaymentDelayYears * 12;
        const cappedStartMonth = Math.min(requestedStartMonth, projectionMonths);
        const repaymentWindowMonths = 8 * 12; // 8 years
        const months = Math.max(projectionMonths, cappedStartMonth + repaymentWindowMonths);

        const outstandingInterest = (finalMonth?.cumulativeInterest + interestDuringResidency);
        let outstandingPrincipal = (finalMonth?.totalDebt) ?? 0;
        let accruedInterest = 0;

        const data: Array<any> = [];

        for (let m = 0; m <= months; m++) {
            const year = Math.floor(m / 12);
            const month = m % 12;

            const monthlyInterest = outstandingPrincipal * (interestRate / 100) / 12;
            // accumulate interest
            let curOutstandingInterest = (data.length === 0 ? outstandingInterest : data[data.length - 1].outstandingInterest ?? outstandingInterest) + monthlyInterest;
            accruedInterest += monthlyInterest;

            let paymentRemaining = repaymentMonthly;

            // pay interest first
            const payInterest = Math.min(curOutstandingInterest, paymentRemaining);
            curOutstandingInterest -= payInterest;
            paymentRemaining -= payInterest;

            // then pay principal
            const payPrincipal = Math.min(outstandingPrincipal, paymentRemaining);
            outstandingPrincipal -= payPrincipal;
            paymentRemaining -= payPrincipal;

            if (curOutstandingInterest + outstandingPrincipal <= 0) {
                outstandingPrincipal = 0;
                curOutstandingInterest = 0;
            }

            data.push({
                month: m,
                label: month === 0 ? `Yr ${year}` : month === 6 ? `Yr ${year}.5` : "",
                showLabel: month === 0 || month === 6,
                totalDebt: Math.round(outstandingPrincipal + curOutstandingInterest),
                totalDebtAnnualStep: 0,
                cumulativeInterest: Math.round(accruedInterest),
                expenses: Math.round(finalMonth?.totalDebt ?? 0),
                total: Math.round((finalMonth?.totalDebt ?? 0) + accruedInterest),
                outstandingInterest: curOutstandingInterest,
            });

            // stop early if fully paid
            if (outstandingPrincipal === 0 && curOutstandingInterest === 0) {
                break;
            }
        }

        return data;
    }, [finalMonth, interestRate, repaymentMonthly, years, repaymentDelayYears]);

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
            <header className="app-header">
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                    <h1 className="header-title">
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

            <div className="app-layout">
                <aside className="sidebar-panel">
                    <section>
                        <SectionHeader label="Student Loan" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <NumberInput
                                label="Initial Balance"
                                value={loanBalance}
                                onChange={setLoanBalance}
                                min={0}
                                max={500000}
                                step={500}
                            />
                            <NumberInput
                                label="OSAP Loans (Estimated Annual)"
                                value={osapLoanBalance}
                                onChange={setOsapLoanBalance}
                                min={0}
                                max={500000}
                                step={100}
                            />
                            <NumberInput
                                label="OSAP Grants (Estimated Annual)"
                                value={osapGrants}
                                onChange={setOsapGrants}
                                min={0}
                                max={20000}
                                step={100}
                            />
                            <NumberInput
                                label="Interest Rate"
                                value={interestRate}
                                onChange={setInterestRate}
                                min={0}
                                max={20}
                                step={0.01}
                                suffix="%"
                                decimals={1}
                            />
                        </div>
                    </section>

                    <Divider />
                    <section>
                        <SectionHeader label="Income" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <SliderInput label="Disability Benefit" value={disabilityBenefit} onChange={setDisabilityBenefit} min={0} max={310} step={1} />
                            <SliderInput label="Other Income" value={income} onChange={setIncome} min={0} max={1000} step={1} />
                        </div>
                    </section>

                    <Divider />

                    <section>
                        <SectionHeader label="Purchases" />
                        <div style={{ display: "flex", flexDirection: "row", gap: "0.75em", alignItems: "center", height: "2em" }}>
                            <h5 style={{ fontSize: "medium", padding: "0" }}>Car:</h5>
                            <h5>$24,000</h5>
                        </div>
                    </section>
                    <Divider />

                    <section>
                        <SectionHeader label="Monthly Expenses" />
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <SliderInput label="Phone" value={phone} onChange={setPhone} min={0} max={100} step={1} />
                            <SliderInput label="Groceries" value={groceries} onChange={setGroceries} min={0} max={500} step={10} />
                            <SliderInput label="Utilities" value={utilities} onChange={setUtilities} min={0} max={300} step={10} />
                            <SliderInput label="Gym" value={gym} onChange={setGym} min={0} max={200} step={10} />
                            <SliderInput label="Internet" value={internet} onChange={setInternet} min={0} max={300} step={10} />
                        </div>
                    </section>
                    <Divider />
                    <section>
                        <SectionHeader label="Bigger Expenses" />
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

                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                                <div style={{ flex: 1 }}>
                                    <NumberInput label="One-time Expense" value={oneTimeExpense} onChange={setOneTimeExpense} min={0} max={200000} prefix="$" />
                                </div>

                                <div style={{ width: "140px", display: "flex", flexDirection: "column" }}>
                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Year</label>
                                    <select
                                        value={oneTimeExpenseYear}
                                        onChange={(e) => setOneTimeExpenseYear(parseInt(e.target.value || "1", 10))}
                                        style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--maroon-border)", background: "var(--white)" }}
                                    >
                                        {Array.from({ length: years }, (_, i) => (
                                            <option key={i} value={i + 1}>{`Year ${i + 1}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                                <div style={{ flex: 1 }}>
                                    <NumberInput label="One-time Expense" value={oneTimeExpense2} onChange={setOneTimeExpense2} min={0} max={200000} prefix="$" />
                                </div>

                                <div style={{ width: "140px", display: "flex", flexDirection: "column" }}>
                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Year</label>
                                    <select
                                        value={oneTimeExpense2Year}
                                        onChange={(e) => setOneTimeExpense2Year(parseInt(e.target.value || "1", 10))}
                                        style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--maroon-border)", background: "var(--white)" }}
                                    >
                                        {Array.from({ length: years }, (_, i) => (
                                            <option key={i} value={i + 1}>{`Year ${i + 1}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                                <div style={{ flex: 1 }}>
                                    <NumberInput label="One-time Expense" value={oneTimeExpense3} onChange={setOneTimeExpense3} min={0} max={200000} prefix="$" />
                                </div>

                                <div style={{ width: "140px", display: "flex", flexDirection: "column" }}>
                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Year</label>
                                    <select
                                        value={oneTimeExpense3Year}
                                        onChange={(e) => setOneTimeExpense3Year(parseInt(e.target.value || "1", 10))}
                                        style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--maroon-border)", background: "var(--white)" }}
                                    >
                                        {Array.from({ length: years }, (_, i) => (
                                            <option key={i} value={i + 1}>{`Year ${i + 1}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: "0.6rem" }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        // clear one-time expenses
                                        setOneTimeExpense(0);
                                        setOneTimeExpenseYear(1);
                                        setOneTimeExpense2(0);
                                        setOneTimeExpense2Year(1);
                                        setOneTimeExpense3(0);
                                        setOneTimeExpense3Year(1);

                                        // reset loan / tuition fields
                                        setLoanBalance(0);
                                        setOsapLoanBalance(0);
                                        setOsapGrants(0);
                                        setTuition(0);

                                        // reset monthly expenses and sliders
                                        setPhone(0);
                                        setUtilities(0);
                                        setInternet(0);
                                        setGroceries(0);
                                        setRent(0);
                                        setCar(0);
                                        setFun(0);
                                        setGym(0);
                                        setDisabilityBenefit(0);



                                        // residency / interest
                                        setResidencyPeriod(0);
                                        setInterestDuringResidency(0);


                                        // derived / totals
                                        setTotalAmount(0);
                                        setInterestBefore(0);


                                    }}
                                    className="btn-maroon"
                                >
                                    Zero all inputs
                                </button>
                            </div>
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

                <main className="main-panel">
                    <div className="summary-cards-grid">
                        <SummaryCard label={`Total Debt Used in ${years} yr${years > 1 ? "s" : ""}`} value={finalMonth.expenses} color="var(--maroon)" />
                        <SummaryCard label={`Interest Collected in ${years} yr${years > 1 ? "s" : ""}`} value={finalMonth.cumulativeInterest} color="var(--maroon-light)" />
                        <SummaryCard label="Total Debt + Interest After 4 Years" value={finalMonth.totalDebt + finalMonth.cumulativeInterest} color={finalMonth.totalDebt === 0 ? "#2d6a3f" : "var(--maroon-dark)"} note={finalMonth.totalDebt === 0 ? "Paid off! 🎉" : undefined} />
                    </div>

                    <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--maroon-border)", borderRadius: "8px", padding: "1.5rem", flex: 1, minHeight: "280px", maxHeight: "50vh" }}>
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
                        <SectionHeader label="Annual Spending" />
                        <div className="annual-cards">
                            <div className="annual-card">
                                <div style={{ marginBottom: "1em", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Spent: {projectionData[11].expenses}</div>
                                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Limit: 90000</div>
                            </div>
                            <div className="annual-card">
                                <div style={{ marginBottom: "1em", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Spent: {projectionData[23].expenses - projectionData[11].expenses}</div>
                                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Limit: 90000</div>
                            </div>
                            <div className="annual-card">
                                <div style={{ marginBottom: "1em", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Spent: {projectionData[35].expenses - projectionData[23].expenses}</div>
                                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Limit: 90000</div>
                            </div>
                            <div className="annual-card">
                                <div style={{ marginBottom: "1em", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Spent: {projectionData[47].expenses - projectionData[35].expenses}</div>
                                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Limit: 90000</div>
                            </div>
                        </div>
                    </section>
                    <Divider />
                    <section>
                        <SectionHeader label="Repayment Plan" />
                        <div className="repayment-flex">
                            <div className="repayment-controls-col">


                                <SliderInput label="Salary (annual after tax)" value={salary} onChange={setSalary} min={0} max={800000} step={1000} />

                                <SliderInput label="Monthly Payment" value={repaymentMonthly} onChange={setRepaymentMonthly} min={0} max={Math.max(0, Math.floor(salary / 12))} step={25} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0, backgroundColor: "var(--white)", border: "1px solid var(--maroon-border)", borderRadius: "8px", padding: "1rem" }}>
                                <DebtChart data={repaymentProjectionData} years={repaymentChartYears} debtOnly />
                            </div>
                        </div>
                    </section>
                    <div className="payback-card" style={{ backgroundColor: "var(--white)", border: "1px solid var(--maroon-border)", borderRadius: "8px", padding: "1rem" }}>
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

                                <div className="stats-row">
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Before repayment</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>${interestBefore.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>During residency</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>${Math.round(interestDuringResidency).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>During repayment</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>${repaymentProjectionData[repaymentProjectionData.length - 1].cumulativeInterest.toLocaleString()}</div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total interest</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "var(--maroon-dark)" }}>${Math.round(interestBefore + repaymentProjectionData[repaymentProjectionData.length - 1].cumulativeInterest + interestDuringResidency).toLocaleString()}</div>
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

                                <div className="stats-row">
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Principal</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>${finalMonth.expenses.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Interest</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>${Math.round(interestBefore + repaymentProjectionData[repaymentProjectionData.length - 1].cumulativeInterest + interestDuringResidency).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Paid</div>
                                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "var(--maroon-dark)" }}>${Math.round(finalMonth.expenses + (interestBefore + repaymentProjectionData[repaymentProjectionData.length - 1].cumulativeInterest + interestDuringResidency)).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, fontFamily: "'DM Mono', monospace" }}>* Projections assume fixed monthly expenses and constant interest rate. Car and fun values represent estimates. This is not financial advice.</p>
                </main>
            </div>

        </div >
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
