import Link from "next/link";
import { formatHebrewDateFull } from "@/lib/dates";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  currentDate: string;
  latestDate: string | null;
  yesterdayDate: string | null;
  dayBeforeDate: string | null;
}

export default function Header({
  currentDate,
  latestDate,
  yesterdayDate,
  dayBeforeDate,
}: HeaderProps) {
  const isToday = latestDate === currentDate;
  const isYesterday = yesterdayDate === currentDate;

  return (
    <header className="border-b border-hairline">
      <div className="max-w-3xl mx-auto px-5 pt-8 pb-5 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <Link href="/" className="block">
            <h1 className="font-headline text-4xl sm:text-5xl font-700 tracking-tight text-ink">
              היומית
            </h1>
          </Link>
          <ThemeToggle />
        </div>

        <p className="mt-2 text-ink-soft text-sm sm:text-base">
          החדשות החשובות מהיממה האחרונה
        </p>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-ink-faint text-sm">
          <span>{formatHebrewDateFull(currentDate)}</span>
        </div>

        <nav className="mt-6 flex items-center gap-5 text-sm">
          <Link
            href="/"
            className={`pb-1 border-b-2 ${
              isToday ? "border-accent text-ink font-medium" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            היום
          </Link>
          {yesterdayDate ? (
            <Link
              href={`/edition/${yesterdayDate}`}
              className={`pb-1 border-b-2 ${
                isYesterday ? "border-accent text-ink font-medium" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              אתמול
            </Link>
          ) : (
            <span className="pb-1 border-b-2 border-transparent text-ink-faint/50 cursor-default">אתמול</span>
          )}
          {dayBeforeDate ? (
            <Link
              href={`/edition/${dayBeforeDate}`}
              className={`pb-1 border-b-2 ${
                dayBeforeDate === currentDate ? "border-accent text-ink font-medium" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              שלשום
            </Link>
          ) : (
            <span className="pb-1 border-b-2 border-transparent text-ink-faint/50 cursor-default">שלשום</span>
          )}
          <Link
            href="/archive"
            className="pb-1 border-b-2 border-transparent text-ink-soft hover:text-ink"
          >
            ארכיון
          </Link>
        </nav>
      </div>
    </header>
  );
}
