import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-hairline">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 text-xs text-ink-faint flex flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} היומית — מהדורה יומית אחת, ולא רגע יותר.</span>
        <Link href="/archive" className="hover:text-ink">
          ארכיון מהדורות
        </Link>
      </div>
    </footer>
  );
}
