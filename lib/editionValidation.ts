import { CATEGORY_LABELS, CATEGORY_ORDER, isCategory } from "./categories";
import { ArticleInput, Category, EditionInput, SectionInput } from "./types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IMPORTANCE = ["lead", "main", "regular"];
const VERIFICATION = ["confirmed", "reported", "claim", "unverified"];
const DEFAULT_TITLE = "חדשות היום";

export interface EditionPreview {
  date: string;
  title: string;
  dailySummary: string;
  totalItems: number;
  sections: { category: Category; title: string; count: number }[];
  leadHeadline: string | null;
  warnings: string[];
}

export type ValidationResult =
  | { ok: true; edition: EditionInput; preview: EditionPreview }
  | { ok: false; errors: string[] };

/**
 * Turn whatever was pasted (possibly wrapped in ```json fences or with chat
 * text around it, as copied from ChatGPT) into the bare JSON text.
 */
export function cleanPastedJson(raw: string): string {
  let text = raw.replace(/^\uFEFF/, "").trim();

  const fenced = text.match(/```[a-zA-Z]*\s*\n?([\s\S]*?)```/);
  if (fenced) text = fenced[1].trim();

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) text = text.slice(first, last + 1);
  return text;
}

// Phones and chat apps sometimes swap straight quotes for curly ones and
// insert invisible direction marks. Only applied as a retry, since curly
// quotes are legitimate inside Hebrew text values.
function normalizeTypography(text: string): string {
  return text
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u00A0\u200B\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, (ch) => (ch === "\u00A0" ? " " : ""));
}

export function parsePastedJson(raw: string): { ok: true; data: unknown } | { ok: false; error: string } {
  if (!raw || !raw.trim()) return { ok: false, error: "לא הודבק תוכן." };
  const text = cleanPastedJson(raw);
  if (!text.startsWith("{")) {
    return { ok: false, error: "לא נמצא JSON בטקסט שהודבק. ודא שהעתקת את כל ה-JSON, מהסוגר { ועד הסוגר }." };
  }
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (err) {
    try {
      return { ok: true, data: JSON.parse(normalizeTypography(text)) };
    } catch {
      const line = err instanceof Error ? err.message.match(/line (\d+)/)?.[1] : undefined;
      return {
        ok: false,
        error: `ה-JSON אינו תקין מבחינת תחביר, כנראה חסר פסיק, מרכאה או סוגר, או שההעתקה נקטעה באמצע.${line ? ` הבעיה בסביבת שורה ${line}.` : ""}`,
      };
    }
  }
}

function isRealDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function todayInIsrael(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
}

export function validateEdition(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, errors: ["ה-JSON צריך להיות אובייקט אחד של מהדורה (שמתחיל ב-{)."] };
  }
  const input = data as Record<string, unknown>;

  const date = str(input.date);
  if (!date) errors.push('חסר תאריך המהדורה (השדה "date").');
  else if (!isRealDate(date)) errors.push(`התאריך "${date}" אינו תקין. הפורמט הנדרש: YYYY-MM-DD, למשל 2026-09-23.`);

  let title = str(input.title);
  if (!title) {
    title = DEFAULT_TITLE;
    warnings.push(`לא הוגדרה כותרת למהדורה, ולכן תשמש ברירת המחדל "${DEFAULT_TITLE}".`);
  }

  const dailySummary = str(input.dailySummary);
  if (!dailySummary) warnings.push('חסר "היום בקצרה" (השדה "dailySummary").');

  if (!Array.isArray(input.sections)) {
    errors.push('חסרה רשימת המדורים (השדה "sections").');
    return { ok: false, errors };
  }

  const seenCategories = new Set<string>();
  const seenIds = new Set<string>();
  const byCategory = new Map<Category, ArticleInput[]>();
  const leadFromImportance: ArticleInput[] = [];

  input.sections.forEach((rawSection, sIdx) => {
    const section = (rawSection ?? {}) as Record<string, unknown>;
    const category = str(section.category);
    if (!isCategory(category)) {
      errors.push(
        `מדור מספר ${sIdx + 1}: הקטגוריה "${category || "(ריקה)"}" אינה מוכרת. הערכים האפשריים: ${CATEGORY_ORDER.join(", ")}.`
      );
      return;
    }
    const label = CATEGORY_LABELS[category];
    if (seenCategories.has(category)) {
      errors.push(`המדור "${label}" מופיע יותר מפעם אחת.`);
      return;
    }
    seenCategories.add(category);

    if (!Array.isArray(section.items)) {
      errors.push(`במדור "${label}" חסרה רשימת הידיעות (השדה "items").`);
      return;
    }

    const items: ArticleInput[] = [];
    section.items.forEach((rawItem, iIdx) => {
      const item = (rawItem ?? {}) as Record<string, unknown>;
      const where = `במדור "${label}", ידיעה ${iIdx + 1}`;
      const headline = str(item.headline);
      const summary = str(item.summary);
      if (!headline) errors.push(`${where}: חסרה כותרת ("headline").`);
      if (!summary) errors.push(`${where}${headline ? ` ("${headline}")` : ""}: חסר תקציר ("summary").`);

      const id = str(item.id);
      if (id) {
        if (seenIds.has(id)) errors.push(`${where}: המזהה "${id}" כבר משמש ידיעה אחרת במהדורה.`);
        seenIds.add(id);
      }

      const importance = str(item.importance) || "regular";
      if (!IMPORTANCE.includes(importance)) {
        errors.push(`${where}: ערך החשיבות "${importance}" אינו תקין. הערכים האפשריים: lead, main, regular.`);
      }
      const verification = str(item.verification) || "confirmed";
      if (!VERIFICATION.includes(verification)) {
        errors.push(
          `${where}: ערך האימות "${verification}" אינו תקין. הערכים האפשריים: confirmed, reported, claim, unverified.`
        );
      }

      const sources = Array.isArray(item.sources) ? item.sources : [];
      if (sources.length === 0) {
        errors.push(`${where}${headline ? ` ("${headline}")` : ""}: חסר לפחות מקור אחד ("sources").`);
      }
      const cleanSources = sources.map((rawSource, srcIdx) => {
        const source = (rawSource ?? {}) as Record<string, unknown>;
        const name = str(source.name);
        const url = str(source.url);
        if (!name) errors.push(`${where}: למקור ${srcIdx + 1} חסר שם ("name").`);
        if (!isHttpUrl(url)) errors.push(`${where}: הקישור של מקור ${srcIdx + 1} אינו כתובת אינטרנט תקינה.`);
        return { name, url };
      });

      const imageUrl = str(item.imageUrl);
      if (imageUrl && !isHttpUrl(imageUrl)) {
        errors.push(`${where}: כתובת התמונה ("imageUrl") אינה כתובת אינטרנט תקינה.`);
      }

      const article: ArticleInput = {
        id: id || undefined,
        slug: str(item.slug) || undefined,
        headline,
        summary,
        content: str(item.content) || null,
        imageUrl: imageUrl || null,
        importance: importance as ArticleInput["importance"],
        verification: verification as ArticleInput["verification"],
        sources: cleanSources,
      };
      if (importance === "lead") leadFromImportance.push(article);
      items.push(article);
    });
    byCategory.set(category, items);
  });

  // Resolve the lead story: an explicit leadStoryId wins; otherwise fall back
  // to the single item marked importance "lead".
  let leadStoryId = str(input.leadStoryId) || null;
  let leadHeadline: string | null = null;
  const allItems = [...byCategory.values()].flat();
  if (leadStoryId) {
    const lead = allItems.find((a) => a.id === leadStoryId);
    if (!lead) errors.push(`הידיעה הראשית ("leadStoryId": "${leadStoryId}") לא נמצאה בין הידיעות במהדורה.`);
    else leadHeadline = lead.headline;
  } else if (leadFromImportance.length === 1) {
    const lead = leadFromImportance[0];
    if (!lead.id) {
      let id = "lead-story";
      for (let n = 2; seenIds.has(id); n++) id = `lead-story-${n}`;
      lead.id = id;
    }
    leadStoryId = lead.id;
    leadHeadline = lead.headline;
  } else if (leadFromImportance.length > 1) {
    errors.push('יותר מידיעה אחת מסומנת כ-"lead". יש לבחור ידיעה ראשית אחת בעזרת "leadStoryId".');
  } else {
    warnings.push("לא הוגדרה ידיעה ראשית. המהדורה תוצג בלי ידיעה ראשית בראש העמוד.");
  }

  if (allItems.length === 0) errors.push("אין אף ידיעה במהדורה.");

  if (errors.length > 0) return { ok: false, errors };

  const missing = CATEGORY_ORDER.filter((c) => (byCategory.get(c) ?? []).length === 0);
  if (missing.length > 0) {
    warnings.push(`אין ידיעות במדורים: ${missing.map((c) => CATEGORY_LABELS[c]).join(", ")}.`);
  }
  if (date !== todayInIsrael()) {
    warnings.push("שים לב: תאריך המהדורה אינו התאריך של היום.");
  }

  const sections: SectionInput[] = CATEGORY_ORDER.map((category) => ({
    category,
    title: CATEGORY_LABELS[category],
    items: byCategory.get(category) ?? [],
  }));

  return {
    ok: true,
    edition: { date, title, dailySummary, leadStoryId, sections },
    preview: {
      date,
      title,
      dailySummary,
      totalItems: allItems.length,
      sections: sections.map((s) => ({ category: s.category, title: s.title, count: s.items.length })),
      leadHeadline,
      warnings,
    },
  };
}
