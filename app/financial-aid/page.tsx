import type { Metadata } from "next";
import { DirectoryPage } from "@/components/directory-page";
import { categoryHeadings, type DirectorySearchParams } from "@/lib/navigation";

const heading = categoryHeadings["financial-aid"];

export const metadata: Metadata = {
  title: heading.title,
  description: heading.description,
};

export default function FinancialAidPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  return <DirectoryPage searchParams={searchParams} category="financial-aid" />;
}
