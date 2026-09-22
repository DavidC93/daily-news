import Image from "next/image";
import Link from "next/link";
import { Article } from "@/lib/types";
import SourceList from "./SourceList";
import VerificationTag from "./VerificationTag";

export default function LeadStory({ article, date }: { article: Article; date: string }) {
  const href = `/edition/${date}/${article.slug}`;

  return (
    <article className="pb-8 mb-8 border-b border-hairline">
      {article.imageUrl && (
        <Link href={href} className="block mb-5">
          <div className="relative w-full aspect-16/10 overflow-hidden bg-hairline/40">
            <Image
              src={article.imageUrl}
              alt={article.headline}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        </Link>
      )}
      <div className="mb-2">
        <VerificationTag verification={article.verification} />
      </div>
      <h2 className="font-headline text-3xl sm:text-5xl leading-[1.15] font-600 mb-4">
        <Link href={href} className="hover:text-accent transition-colors">
          {article.headline}
        </Link>
      </h2>
      <p className="text-lg text-ink-soft leading-relaxed max-w-2xl">{article.summary}</p>
      <SourceList sources={article.sources} />
    </article>
  );
}
