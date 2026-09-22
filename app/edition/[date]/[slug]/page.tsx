import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getArticleBySlug } from "@/lib/queries";
import { getNavContext } from "@/lib/nav";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatHebrewDateFull } from "@/lib/dates";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SourceList from "@/components/SourceList";
import VerificationTag from "@/components/VerificationTag";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ date: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const result = await getArticleBySlug(date, slug);
  if (!result) return {};
  const { article } = result;
  return {
    title: article.headline,
    description: article.summary,
    alternates: { canonical: `/edition/${date}/${slug}` },
    openGraph: {
      title: article.headline,
      description: article.summary,
      url: `/edition/${date}/${slug}`,
      type: "article",
      images: article.imageUrl ? [article.imageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { date, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const result = await getArticleBySlug(date, slug);
  if (!result) notFound();
  const { edition, article } = result;

  const nav = await getNavContext(date);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.headline,
    description: article.summary,
    image: article.imageUrl ? [article.imageUrl] : undefined,
    datePublished: edition.createdAt,
    dateModified: article.updatedAt,
    articleSection: CATEGORY_LABELS[article.category],
    inLanguage: "he",
  };

  return (
    <>
      <Header
        currentDate={nav.currentDate}
        latestDate={nav.latestDate}
        yesterdayDate={nav.yesterdayDate}
        dayBeforeDate={nav.dayBeforeDate}
      />
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 sm:px-8 py-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="mb-5 text-sm">
          <Link href={`/edition/${date}`} className="text-ink-faint hover:text-accent">
            ← חזרה למהדורת {formatHebrewDateFull(date)}
          </Link>
        </div>

        <p className="text-xs font-medium tracking-wide text-accent mb-2">
          {CATEGORY_LABELS[article.category]}
        </p>

        <div className="mb-2">
          <VerificationTag verification={article.verification} />
        </div>

        <h1 className="font-headline text-3xl sm:text-4xl leading-[1.2] font-600 mb-4">
          {article.headline}
        </h1>

        <p className="text-lg text-ink-soft leading-relaxed mb-6">{article.summary}</p>

        {article.imageUrl && (
          <div className="relative w-full aspect-16/10 overflow-hidden bg-hairline/40 mb-6">
            <Image
              src={article.imageUrl}
              alt={article.headline}
              fill
              sizes="(min-width: 768px) 672px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}

        {article.content && (
          <div className="prose-block text-[17px] leading-loose text-ink whitespace-pre-line mb-6">
            {article.content}
          </div>
        )}

        <SourceList sources={article.sources} />
      </main>
      <Footer />
    </>
  );
}
