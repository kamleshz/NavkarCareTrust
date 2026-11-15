import type { Metadata } from "next";
import { DirectoryPage, type DirectorySearchParams } from "@/components/directory-page";

export const metadata: Metadata = {
  title: "Find cancer care and support",
  description: "Browse reviewed cancer care and financial support resources in India.",
};

export default function Home({ searchParams }: { searchParams: Promise<DirectorySearchParams> }) {
  return <DirectoryPage searchParams={searchParams} />;
}
