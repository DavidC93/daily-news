import { getLatestEdition } from "@/lib/queries";
import { getNavContext } from "@/lib/nav";
import EditionView from "@/components/EditionView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const edition = await getLatestEdition();

  if (!edition) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-headline text-3xl mb-2">היומית</h1>
          <p className="text-ink-soft">טרם פורסמה מהדורה.</p>
        </div>
      </main>
    );
  }

  const nav = await getNavContext(edition.date);
  return <EditionView edition={edition} nav={nav} />;
}
