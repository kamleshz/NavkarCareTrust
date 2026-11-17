import type { Metadata } from "next";
import { DirectoryPage } from "@/components/directory-page";
import { categoryHeadings, type DirectorySearchParams } from "@/lib/navigation";

const heading = categoryHeadings["medicine-assistance"];

export const metadata: Metadata = {
  title: heading.title,
  description: heading.description,
};

export default function MedicineAssistancePage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  return <DirectoryPage searchParams={searchParams} category="medicine-assistance" />;
}
