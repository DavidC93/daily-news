import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthed } from "@/lib/auth";
import { listEditionDates } from "@/lib/queries";
import { formatHebrewDateFull } from "@/lib/dates";
import LogoutButton from "./LogoutButton";

export default async function AdminDashboard() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const editions = await listEditionDates();

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-5 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-600">ניהול מהדורות</h1>
        <LogoutButton />
      </div>

      <Link
        href="/admin/publish"
        className="flex items-center justify-center h-12 mb-8 rounded-sm bg-ink text-paper font-medium hover:opacity-90"
      >
        פרסום מהדורה חדשה
      </Link>

      {editions.length === 0 && (
        <p className="text-ink-soft">
          אין עדיין מהדורות.
        </p>
      )}

      <ul>
        {editions.map((edition) => (
          <li key={edition.date} className="py-3 border-b border-hairline flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{edition.title}</div>
              <div className="text-sm text-ink-faint">{formatHebrewDateFull(edition.date)}</div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Link href={`/edition/${edition.date}`} className="text-ink-soft hover:text-accent">
                צפייה
              </Link>
              <Link href={`/admin/edition/${edition.date}`} className="text-accent hover:underline">
                עריכה
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
