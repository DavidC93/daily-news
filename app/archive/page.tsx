import Link from "next/link";
import { Metadata } from "next";
import { listEditionDates } from "@/lib/queries";
import { getNavContext } from "@/lib/nav";
import { formatHebrewDayOfMonth, formatHebrewMonthYear } from "@/lib/dates";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ארכיון מהדורות",
  description: "כל מהדורות היומית, מסודרות לפי שנה, חודש ויום.",
};

export default async function ArchivePage() {
  const editions = await listEditionDates();
  const latestDate = editions[0]?.date ?? new Date().toISOString().slice(0, 10);
  const nav = await getNavContext(latestDate);

  const groups = new Map<string, { monthLabel: string; items: typeof editions }>();
  for (const edition of editions) {
    const monthKey = edition.date.slice(0, 7);
    if (!groups.has(monthKey)) {
      groups.set(monthKey, { monthLabel: formatHebrewMonthYear(edition.date), items: [] });
    }
    groups.get(monthKey)!.items.push(edition);
  }

  return (
    <>
      <Header
        currentDate={nav.currentDate}
        latestDate={nav.latestDate}
        yesterdayDate={nav.yesterdayDate}
        dayBeforeDate={nav.dayBeforeDate}
      />
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 sm:px-8 py-8">
        <h1 className="font-headline text-3xl font-600 mb-8">ארכיון מהדורות</h1>

        {editions.length === 0 && <p className="text-ink-soft">אין עדיין מהדורות בארכיון.</p>}

        {Array.from(groups.entries()).map(([monthKey, group]) => (
          <section key={monthKey} className="mb-10">
            <h2 className="font-headline text-xl font-600 mb-3 pb-2 border-b border-ink">
              {group.monthLabel}
            </h2>
            <ul>
              {group.items.map((edition) => (
                <li key={edition.date} className="py-3 border-b border-hairline last:border-b-0">
                  <Link href={`/edition/${edition.date}`} className="group flex items-baseline justify-between gap-4">
                    <span className="text-ink-soft group-hover:text-accent">
                      {formatHebrewDayOfMonth(edition.date)}
                    </span>
                    <span className="text-sm text-ink-faint truncate">{edition.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
