import { Section } from "@/lib/types";
import ArticleCard from "./ArticleCard";

export default function SectionBlock({ section, date }: { section: Section; date: string }) {
  if (section.items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="font-headline text-xl sm:text-2xl font-600 mb-3 pb-2 border-b border-ink">
        {section.title}
      </h2>
      <div>
        {section.items.map((article) => (
          <ArticleCard key={article.id} article={article} date={date} />
        ))}
      </div>
    </section>
  );
}
