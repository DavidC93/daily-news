"use client";

import { useState } from "react";
import { Article, Edition, Importance, Verification } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/categories";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "שגיאה לא צפויה";
}

interface ArticleUpdate {
  headline: string;
  summary: string;
  content: string | null;
  imageUrl: string | null;
  importance: Importance;
  verification: Verification;
  sources: { name: string; url: string }[];
}

const IMPORTANCE_LABELS: Record<Importance, string> = {
  lead: "ראשית",
  main: "מרכזית",
  regular: "רגילה",
};

const VERIFICATION_OPTIONS: Verification[] = ["confirmed", "reported", "claim", "unverified"];
const VERIFICATION_LABELS: Record<Verification, string> = {
  confirmed: "מאומת",
  reported: "דיווח",
  claim: "טענה",
  unverified: "לא אומת",
};

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `שגיאה (${res.status})`);
  }
  return res.json().catch(() => ({}));
}

export default function EditionEditor({ initialEdition }: { initialEdition: Edition }) {
  const [edition, setEdition] = useState(initialEdition);
  const [title, setTitle] = useState(initialEdition.title);
  const [summary, setSummary] = useState(initialEdition.dailySummary);
  const [savingMeta, setSavingMeta] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveMeta() {
    setSavingMeta(true);
    setError(null);
    try {
      await api(`/api/news/${edition.date}`, "PATCH", { title, dailySummary: summary });
      setEdition((e) => ({ ...e, title, dailySummary: summary }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSavingMeta(false);
    }
  }

  async function setLead(id: string) {
    setError(null);
    try {
      await api(`/api/news/${edition.date}`, "PATCH", { leadStoryId: id || null });
      setEdition((e) => ({ ...e, leadStoryId: id || null }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function deleteArticle(articleId: string) {
    if (!confirm("למחוק את הידיעה הזו?")) return;
    setError(null);
    try {
      await api(`/api/news/${edition.date}/articles/${articleId}`, "DELETE");
      setEdition((e) => ({
        ...e,
        leadStoryId: e.leadStoryId === articleId ? null : e.leadStoryId,
        sections: e.sections.map((s) => ({
          ...s,
          items: s.items.filter((a) => a.id !== articleId),
        })),
      }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function move(category: string, articleId: string, dir: -1 | 1) {
    const section = edition.sections.find((s) => s.category === category)!;
    const ids = section.items.map((a) => a.id);
    const idx = ids.indexOf(articleId);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];

    setError(null);
    try {
      await api(`/api/news/${edition.date}/reorder`, "POST", {
        category,
        orderedIds: ids,
      });
      setEdition((e) => ({
        ...e,
        sections: e.sections.map((s) =>
          s.category === category
            ? { ...s, items: ids.map((id) => s.items.find((a) => a.id === id)!) }
            : s
        ),
      }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function saveArticle(articleId: string, updates: ArticleUpdate) {
    setError(null);
    try {
      await api(`/api/news/${edition.date}/articles/${articleId}`, "PATCH", updates);
      const sources = updates.sources.map((s, i) => ({ id: `${articleId}-src-${i}`, ...s }));
      setEdition((e) => ({
        ...e,
        sections: e.sections.map((s) => ({
          ...s,
          items: s.items.map((a) => (a.id === articleId ? { ...a, ...updates, sources } : a)),
        })),
      }));
      setEditingId(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const allArticles = edition.sections.flatMap((s) => s.items);

  return (
    <div className="mt-6">
      {error && (
        <p className="mb-4 text-sm text-accent bg-accent/10 border border-accent/30 rounded-sm px-3 py-2">
          {error}
        </p>
      )}

      <section className="mb-8 pb-6 border-b border-hairline">
        <label className="block text-xs text-ink-faint mb-1">כותרת המהדורה</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-hairline rounded-sm px-3 py-2 mb-4 bg-card"
        />
        <label className="block text-xs text-ink-faint mb-1">היום בקצרה</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          className="w-full border border-hairline rounded-sm px-3 py-2 mb-3 bg-card"
        />
        <button
          onClick={saveMeta}
          disabled={savingMeta}
          className="bg-ink text-paper rounded-sm px-4 py-1.5 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {savingMeta ? "שומר..." : "שמירה"}
        </button>

        <div className="mt-5">
          <label className="block text-xs text-ink-faint mb-1">ידיעה ראשית (Lead)</label>
          <select
            value={edition.leadStoryId ?? ""}
            onChange={(e) => setLead(e.target.value)}
            className="w-full border border-hairline rounded-sm px-3 py-2 bg-card"
          >
            <option value="">— ללא —</option>
            {allArticles.map((a) => (
              <option key={a.id} value={a.id}>
                {CATEGORY_LABELS[a.category]}: {a.headline}
              </option>
            ))}
          </select>
        </div>
      </section>

      {edition.sections.map((section) => (
        <section key={section.category} className="mb-8">
          <h2 className="font-headline text-lg font-600 mb-3 pb-2 border-b border-ink">
            {section.title}
          </h2>
          {section.items.length === 0 && (
            <p className="text-sm text-ink-faint mb-3">אין ידיעות במדור זה.</p>
          )}
          {section.items.map((article, idx) => (
            <div key={article.id} className="border-b border-hairline py-3">
              {editingId === article.id ? (
                <ArticleEditForm
                  article={article}
                  onCancel={() => setEditingId(null)}
                  onSave={(updates) => saveArticle(article.id, updates)}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-ink-faint mb-1">
                      {IMPORTANCE_LABELS[article.importance]}
                      {edition.leadStoryId === article.id ? " · ראשית המהדורה" : ""}
                    </div>
                    <div className="font-medium truncate">{article.headline}</div>
                    <div className="text-sm text-ink-soft truncate">{article.summary}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-sm">
                    <button
                      onClick={() => move(section.category, article.id, -1)}
                      disabled={idx === 0}
                      className="text-ink-faint hover:text-accent disabled:opacity-30"
                      aria-label="הזז למעלה"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(section.category, article.id, 1)}
                      disabled={idx === section.items.length - 1}
                      className="text-ink-faint hover:text-accent disabled:opacity-30"
                      aria-label="הזז למטה"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => setEditingId(article.id)}
                      className="text-accent hover:underline"
                    >
                      עריכה
                    </button>
                    <button
                      onClick={() => deleteArticle(article.id)}
                      className="text-ink-faint hover:text-accent"
                    >
                      מחיקה
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function ArticleEditForm({
  article,
  onSave,
  onCancel,
}: {
  article: Article;
  onSave: (updates: ArticleUpdate) => void;
  onCancel: () => void;
}) {
  const [headline, setHeadline] = useState(article.headline);
  const [summary, setSummary] = useState(article.summary);
  const [content, setContent] = useState(article.content ?? "");
  const [imageUrl, setImageUrl] = useState(article.imageUrl ?? "");
  const [importance, setImportance] = useState<Importance>(article.importance);
  const [verification, setVerification] = useState<Verification>(article.verification);
  const [sources, setSources] = useState(article.sources.map((s) => ({ name: s.name, url: s.url })));

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-ink-faint mb-1">כותרת</label>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="w-full border border-hairline rounded-sm px-3 py-2 bg-card"
        />
      </div>
      <div>
        <label className="block text-xs text-ink-faint mb-1">תקציר</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className="w-full border border-hairline rounded-sm px-3 py-2 bg-card"
        />
      </div>
      <div>
        <label className="block text-xs text-ink-faint mb-1">תוכן מורחב (אופציונלי)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full border border-hairline rounded-sm px-3 py-2 bg-card"
        />
      </div>
      <div>
        <label className="block text-xs text-ink-faint mb-1">כתובת תמונה (URL)</label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full border border-hairline rounded-sm px-3 py-2 bg-card"
          dir="ltr"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-ink-faint mb-1">חשיבות</label>
          <select
            value={importance}
            onChange={(e) => setImportance(e.target.value as Importance)}
            className="w-full border border-hairline rounded-sm px-3 py-2 bg-card"
          >
            <option value="main">מרכזית</option>
            <option value="regular">רגילה</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-ink-faint mb-1">סטטוס אימות</label>
          <select
            value={verification}
            onChange={(e) => setVerification(e.target.value as Verification)}
            className="w-full border border-hairline rounded-sm px-3 py-2 bg-card"
          >
            {VERIFICATION_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {VERIFICATION_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-ink-faint mb-1">מקורות</label>
        {sources.map((s, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              value={s.name}
              onChange={(e) =>
                setSources((arr) => arr.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))
              }
              placeholder="שם המקור"
              className="w-32 border border-hairline rounded-sm px-2 py-1.5 bg-card text-sm"
            />
            <input
              value={s.url}
              onChange={(e) =>
                setSources((arr) => arr.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))
              }
              placeholder="URL"
              dir="ltr"
              className="flex-1 border border-hairline rounded-sm px-2 py-1.5 bg-card text-sm"
            />
            <button
              onClick={() => setSources((arr) => arr.filter((_, idx) => idx !== i))}
              className="text-ink-faint hover:text-accent px-1"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => setSources((arr) => [...arr, { name: "", url: "" }])}
          className="text-sm text-accent hover:underline"
        >
          + הוספת מקור
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() =>
            onSave({
              headline,
              summary,
              content: content || null,
              imageUrl: imageUrl || null,
              importance,
              verification,
              sources: sources.filter((s) => s.name && s.url),
            })
          }
          className="bg-ink text-paper rounded-sm px-4 py-1.5 text-sm hover:opacity-90"
        >
          שמירה
        </button>
        <button onClick={onCancel} className="text-sm text-ink-faint hover:text-ink px-2">
          ביטול
        </button>
      </div>
    </div>
  );
}
