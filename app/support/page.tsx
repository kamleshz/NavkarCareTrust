import type { Metadata } from "next";
import { DirectoryPage, type DirectorySearchParams } from "@/components/directory-page";

export const metadata: Metadata = {
  title: "Support directory",
  description: "Browse reviewed cancer care, medicine assistance, and financial aid resources.",
};

export default function SupportPage({ searchParams }: { searchParams: Promise<DirectorySearchParams> }) {
  return <DirectoryPage searchParams={searchParams} />;
}
