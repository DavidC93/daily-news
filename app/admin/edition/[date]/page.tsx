import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAdminAuthed } from "@/lib/auth";
import { getEditionByDate } from "@/lib/queries";
import EditionEditor from "./EditionEditor";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function AdminEditionPage({ params }: Props) {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const { date } = await params;
  const edition = await getEditionByDate(date);
  if (!edition) notFound();

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-5 sm:px-8 py-8">
      <Link href="/admin" className="text-sm text-ink-faint hover:text-accent">
        ← כל המהדורות
      </Link>
      <EditionEditor initialEdition={edition} />
    </main>
  );
}
