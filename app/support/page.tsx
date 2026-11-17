import type { Metadata } from "next";
import { DirectoryPage } from "@/components/directory-page";
import { allSupportHeading, type DirectorySearchParams } from "@/lib/navigation";

export const metadata: Metadata = {
  title: allSupportHeading.title,
  description: allSupportHeading.description,
};

export default function SupportPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  return <DirectoryPage searchParams={searchParams} />;
}
