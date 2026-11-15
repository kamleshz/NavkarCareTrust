import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NavkarCareTrust | Find cancer care and support",
    template: "%s | NavkarCareTrust",
  },
  description:
    "Find hospitals, doctors, medicine assistance, and financial aid programmes for cancer care in India.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body suppressHydrationWarning>
        <Suspense fallback={<div className="header-placeholder" />}>
          <Header />
        </Suspense>
        {children}
        <Footer />
      </body>
    </html>
  );
}
