import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthed } from "@/lib/auth";
import PublishTool from "./PublishTool";

export const metadata: Metadata = {
  title: "פרסום מהדורה",
  robots: { index: false, follow: false },
};

export default async function PublishPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login?next=/admin/publish");

  return (
    <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-10">
      <div className="flex items-baseline justify-between mb-5">
        <h1 className="font-headline text-2xl font-600">פרסום מהדורה</h1>
        <Link href="/admin" className="text-sm text-ink-faint hover:text-accent">
          ניהול
        </Link>
      </div>
      <PublishTool />
    </main>
  );
}
