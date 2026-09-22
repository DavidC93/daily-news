import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getEditionByDate } from "@/lib/queries";
import { getNavContext } from "@/lib/nav";
import { formatHebrewDateFull } from "@/lib/dates";
import EditionView from "@/components/EditionView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const edition = await getEditionByDate(date);
  if (!edition) return {};
  return {
    title: `${edition.title} — ${formatHebrewDateFull(date)}`,
    description: edition.dailySummary?.slice(0, 160) || edition.title,
    alternates: { canonical: `/edition/${date}` },
    openGraph: {
      title: edition.title,
      description: edition.dailySummary,
      url: `/edition/${date}`,
      type: "website",
    },
  };
}

export default async function EditionPage({ params }: Props) {
  const { date } = await params;
  const edition = await getEditionByDate(date);
  if (!edition) notFound();

  const nav = await getNavContext(date);
  return <EditionView edition={edition} nav={nav} />;
}
