import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/dal";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={dmSans.variable}>
      <body suppressHydrationWarning>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
