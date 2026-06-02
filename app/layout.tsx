import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Debt Projector — Post-Grad Financial Planner",
  description: "Project your debt after graduation with spending and interest forecasts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
