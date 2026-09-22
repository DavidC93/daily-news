import Image from "next/image";
import Link from "next/link";
import { Article } from "@/lib/types";
import SourceList from "./SourceList";
import VerificationTag from "./VerificationTag";

export default function ArticleCard({ article, date }: { article: Article; date: string }) {
  const href = `/edition/${date}/${article.slug}`;
  const isMain = article.importance === "main";

  if (isMain) {
    return (
      <article className="py-5 border-b border-hairline last:border-b-0 sm:flex sm:gap-5">
        {article.imageUrl && (
          <Link
            href={href}
            className="block mb-3 sm:mb-0 sm:w-40 sm:shrink-0"
          >
            <div className="relative w-full aspect-4/3 overflow-hidden bg-hairline/40">
              <Image
                src={article.imageUrl}
                alt={article.headline}
                fill
                loading="lazy"
                sizes="(min-width: 640px) 160px, 100vw"
                className="object-cover"
              />
            </div>
          </Link>
        )}
        <div className="flex-1">
          <h3 className="font-headline text-xl sm:text-2xl leading-snug font-600 mb-1.5">
            <Link href={href} className="hover:text-accent transition-colors">
              {article.headline}
            </Link>{" "}
            <VerificationTag verification={article.verification} />
          </h3>
          <p className="text-ink-soft text-sm leading-relaxed">{article.summary}</p>
          <SourceList sources={article.sources} />
        </div>
      </article>
    );
  }

  return (
    <article className="py-4 border-b border-hairline last:border-b-0">
      <h4 className="font-headline text-base sm:text-lg leading-snug font-500 mb-1">
        <Link href={href} className="hover:text-accent transition-colors">
          {article.headline}
        </Link>{" "}
        <VerificationTag verification={article.verification} />
      </h4>
      <p className="text-ink-soft text-sm leading-relaxed">{article.summary}</p>
      <SourceList sources={article.sources} />
    </article>
  );
}
