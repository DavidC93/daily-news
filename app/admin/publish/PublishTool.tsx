"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { EditionPreview } from "@/lib/editionValidation";
import { formatHebrewDateFull } from "@/lib/dates";

type State =
  | { step: "input" }
  | { step: "errors"; errors: string[] }
  | { step: "preview"; preview: EditionPreview }
  | { step: "exists"; preview: EditionPreview }
  | { step: "published"; date: string }
  | { step: "unauthorized" };

const noopSubscribe = () => () => {};

const primaryBtn =
  "w-full h-12 rounded-sm bg-ink text-paper text-base font-medium hover:opacity-90 disabled:opacity-50";
const secondaryBtn = "h-11 px-4 rounded-sm border border-hairline text-sm text-ink-soft hover:text-accent";

export default function PublishTool() {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ step: "input" });
  const [busy, setBusy] = useState(false);
  // false during SSR, real capability after hydration, without a mismatch.
  const canReadClipboard = useSyncExternalStore(
    noopSubscribe,
    () => !!navigator.clipboard?.readText,
    () => false
  );
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.step !== "input") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.step]);

  async function send(action: "check" | "publish") {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, json: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) setState({ step: "unauthorized" });
      else if (data.exists) setState({ step: "exists", preview: data.preview });
      else if (data.errors) setState({ step: "errors", errors: data.errors });
      else if (data.published) setState({ step: "published", date: data.date });
      else if (data.preview) setState({ step: "preview", preview: data.preview });
      else setState({ step: "errors", errors: [data.error || "אירעה תקלה. נסה שוב."] });
    } catch {
      setState({ step: "errors", errors: ["אין חיבור לשרת. בדוק את החיבור לאינטרנט ונסה שוב."] });
    } finally {
      setBusy(false);
    }
  }

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText(clip);
        setState({ step: "input" });
      }
    } catch {
      // Permission denied; the user can still long-press and paste.
    }
  }

  if (state.step === "published") {
    return (
      <div className="py-16 text-center">
        <p className="font-headline text-3xl font-600 mb-3">המהדורה פורסמה בהצלחה</p>
        <p className="text-ink-soft mb-10">{formatHebrewDateFull(state.date)}</p>
        <Link href={`/edition/${state.date}`} className={`${primaryBtn} inline-flex items-center justify-center`}>
          פתח את המהדורה
        </Link>
        <button
          type="button"
          onClick={() => {
            setText("");
            setState({ step: "input" });
          }}
          className="mt-6 text-sm text-ink-faint hover:text-accent"
        >
          פרסום מהדורה נוספת
        </button>
      </div>
    );
  }

  const showingResult = state.step !== "input";

  return (
    <>
      <div className="flex items-center gap-2 mb-4 empty:hidden">
        {canReadClipboard && (
          <button type="button" onClick={pasteFromClipboard} className={secondaryBtn}>
            הדבקה מהלוח
          </button>
        )}
        {text && (
          <button
            type="button"
            onClick={() => {
              setText("");
              setState({ step: "input" });
            }}
            className={secondaryBtn}
          >
            ניקוי
          </button>
        )}
      </div>

      <label htmlFor="edition-json" className="block text-sm text-ink-soft mb-2">
        הדבק כאן את ה-JSON של המהדורה
      </label>
      <textarea
        id="edition-json"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (showingResult) setState({ step: "input" });
        }}
        dir="ltr"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        placeholder={'{ "date": "2026-09-24", "sections": [ … ] }'}
        className={`w-full ${showingResult ? "h-[22vh]" : "h-[45vh]"} p-3 rounded-sm border border-hairline bg-card text-ink font-mono text-[13px] leading-relaxed placeholder:text-ink-faint focus:outline-none focus:border-ink-faint`}
      />

      {!showingResult && (
        <button
          type="button"
          onClick={() => send("check")}
          disabled={busy || !text.trim()}
          className={`${primaryBtn} mt-4`}
        >
          {busy ? "בודק…" : "בדוק מהדורה"}
        </button>
      )}

      <div ref={resultRef} className="scroll-mt-4">
        {state.step === "errors" && (
          <section className="mt-6 border-t-2 border-accent pt-4" role="alert">
            <h2 className="font-medium text-accent mb-3">יש לתקן את הדברים הבאים:</h2>
            <ul className="space-y-2 text-[15px] leading-relaxed">
              {state.errors.map((err, i) => (
                <li key={i} className="pr-4 relative before:content-['•'] before:absolute before:right-0 before:text-ink-faint">
                  {err}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-faint">אפשר לתקן את ה-JSON בשדה למעלה ולבדוק שוב.</p>
            <button type="button" onClick={() => send("check")} disabled={busy} className={`${primaryBtn} mt-4`}>
              {busy ? "בודק…" : "בדוק שוב"}
            </button>
          </section>
        )}

        {state.step === "unauthorized" && (
          <section className="mt-6 border-t-2 border-accent pt-4" role="alert">
            <p className="mb-4">פג תוקף ההתחברות. יש להתחבר מחדש ולהדביק שוב.</p>
            <Link href="/admin/login?next=/admin/publish" className="text-accent underline">
              מעבר להתחברות
            </Link>
          </section>
        )}

        {state.step === "exists" && (
          <section className="mt-6 border-t-2 border-accent pt-4" role="alert">
            <h2 className="font-medium mb-2">כבר קיימת מהדורה לתאריך הזה</h2>
            <p className="text-ink-soft mb-5">
              ל{formatHebrewDateFull(state.preview.date)} כבר פורסמה מהדורה. המהדורה הקיימת לא שונתה.
            </p>
            <Link href={`/edition/${state.preview.date}`} className="text-accent underline">
              צפייה במהדורה הקיימת
            </Link>
          </section>
        )}

        {state.step === "preview" && (
          <Preview preview={state.preview} busy={busy} onPublish={() => send("publish")} />
        )}
      </div>
    </>
  );
}

function Preview({
  preview,
  busy,
  onPublish,
}: {
  preview: EditionPreview;
  busy: boolean;
  onPublish: () => void;
}) {
  return (
    <section className="mt-6 border-t-2 border-ink pt-5">
      <p className="text-sm text-ink-faint mb-1">תצוגה מקדימה</p>
      <h2 className="font-headline text-2xl font-600 leading-snug">{formatHebrewDateFull(preview.date)}</h2>
      <p className="text-ink-soft mt-1">{preview.title}</p>

      <dl className="mt-6 divide-y divide-hairline border-y border-hairline">
        <div className="flex justify-between py-2.5 font-medium">
          <dt>סך הכול ידיעות</dt>
          <dd className="tabular-nums">{preview.totalItems}</dd>
        </div>
        {preview.sections.map((s) => (
          <div key={s.category} className={`flex justify-between py-2.5 ${s.count === 0 ? "text-ink-faint" : ""}`}>
            <dt>{s.title}</dt>
            <dd className="tabular-nums">{s.count}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        <p className="text-sm text-ink-faint mb-1">הידיעה הראשית</p>
        <p className="font-headline text-xl font-600 leading-snug">{preview.leadHeadline ?? "לא הוגדרה"}</p>
      </div>

      <div className="mt-6">
        <p className="text-sm text-ink-faint mb-1">היום בקצרה</p>
        <p className="leading-relaxed whitespace-pre-line">{preview.dailySummary || "—"}</p>
      </div>

      {preview.warnings.length > 0 && (
        <ul className="mt-6 space-y-1.5 text-sm text-ink-soft">
          {preview.warnings.map((w, i) => (
            <li key={i}>⚠︎ {w}</li>
          ))}
        </ul>
      )}

      <button type="button" onClick={onPublish} disabled={busy} className={`${primaryBtn} mt-8`}>
        {busy ? "מפרסם…" : "פרסם מהדורה"}
      </button>
      <p className="mt-3 text-center text-xs text-ink-faint">לאחר הפרסום המהדורה נסגרת ומוצגת לקוראים.</p>
    </section>
  );
}
