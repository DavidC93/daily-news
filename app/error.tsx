"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex-1 flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-headline text-3xl mb-2">המהדורה אינה זמינה כרגע</h1>
        <p className="text-ink-soft mb-6">אירעה תקלה בטעינת העיתון. נסו שוב בעוד רגע.</p>
        <button type="button" onClick={reset} className="underline underline-offset-4">
          נסו שוב
        </button>
      </div>
    </main>
  );
}
