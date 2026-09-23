import { getSql } from "./db";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "./categories";
import {
  Article,
  Category,
  Edition,
  EditionInput,
  EditionListItem,
  Importance,
  Source,
  Verification,
} from "./types";

interface EditionRow {
  id: string;
  date: Date | string;
  title: string;
  daily_summary: string;
  lead_story_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ArticleRow {
  id: string;
  edition_id: string;
  slug: string;
  category: Category;
  headline: string;
  summary: string;
  content: string | null;
  image_url: string | null;
  importance: Importance;
  verification: Verification;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface SourceRow {
  id: string;
  article_id: string;
  name: string;
  url: string;
}

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9֐-׿]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || Math.random().toString(36).slice(2, 8);
}

function randomId(category: string): string {
  return `${category}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(d: Date | string): string {
  if (typeof d === "string") return d;
  return d.toISOString().slice(0, 10);
}

function articleRowToArticle(row: ArticleRow, sources: Source[]): Article {
  return {
    id: row.id,
    editionId: row.edition_id,
    slug: row.slug,
    category: row.category,
    headline: row.headline,
    summary: row.summary,
    content: row.content,
    imageUrl: row.image_url,
    importance: row.importance,
    verification: row.verification,
    sortOrder: row.sort_order,
    sources,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadEditionByRow(editionRow: EditionRow): Promise<Edition> {
  const sql = getSql();
  const articleRows = (await sql`
    SELECT * FROM articles WHERE edition_id = ${editionRow.id}
    ORDER BY category, sort_order, created_at
  `) as unknown as ArticleRow[];
  const articleIds = articleRows.map((r) => r.id);

  const sourcesByArticle = new Map<string, Source[]>();
  if (articleIds.length > 0) {
    const sourceRows = (await sql`
      SELECT * FROM sources WHERE article_id = ANY(${articleIds}) ORDER BY id
    `) as unknown as SourceRow[];
    for (const s of sourceRows) {
      const list = sourcesByArticle.get(s.article_id) ?? [];
      list.push({ id: s.id, name: s.name, url: s.url });
      sourcesByArticle.set(s.article_id, list);
    }
  }

  const articlesByCategory = new Map<Category, Article[]>();
  for (const row of articleRows) {
    const article = articleRowToArticle(row, sourcesByArticle.get(row.id) ?? []);
    const list = articlesByCategory.get(article.category) ?? [];
    list.push(article);
    articlesByCategory.set(article.category, list);
  }

  const sections = CATEGORY_ORDER.map((category) => ({
    category,
    title: CATEGORY_LABELS[category],
    items: articlesByCategory.get(category) ?? [],
  }));

  return {
    id: editionRow.id,
    date: formatDate(editionRow.date),
    title: editionRow.title,
    dailySummary: editionRow.daily_summary,
    leadStoryId: editionRow.lead_story_id,
    sections,
    createdAt: editionRow.created_at,
    updatedAt: editionRow.updated_at,
  };
}

export async function getEditionByDate(date: string): Promise<Edition | null> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM editions WHERE date = ${date}`) as unknown as EditionRow[];
  if (rows.length === 0) return null;
  return loadEditionByRow(rows[0]);
}

export async function getLatestEdition(): Promise<Edition | null> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM editions ORDER BY date DESC LIMIT 1`) as unknown as EditionRow[];
  if (rows.length === 0) return null;
  return loadEditionByRow(rows[0]);
}

export async function getLatestEditionDate(): Promise<string | null> {
  const sql = getSql();
  const rows = (await sql`SELECT date FROM editions ORDER BY date DESC LIMIT 1`) as unknown as Pick<EditionRow, "date">[];
  return rows[0] ? formatDate(rows[0].date) : null;
}

export async function getRecentEditionDates(
  fromDate: string,
  count: number
): Promise<string[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT date FROM editions WHERE date <= ${fromDate} ORDER BY date DESC LIMIT ${count}
  `) as unknown as Pick<EditionRow, "date">[];
  return rows.map((r) => formatDate(r.date));
}

export async function listEditionDates(): Promise<EditionListItem[]> {
  const sql = getSql();
  const rows = (await sql`SELECT date, title FROM editions ORDER BY date DESC`) as unknown as Pick<
    EditionRow,
    "date" | "title"
  >[];
  return rows.map((r) => ({ date: formatDate(r.date), title: r.title }));
}

export async function createEdition(input: EditionInput): Promise<Edition> {
  const sql = getSql();

  const usedIds = new Set<string>();
  type ArticleRow = {
    id: string;
    slug: string;
    category: Category;
    headline: string;
    summary: string;
    content: string | null;
    imageUrl: string | null;
    importance: string;
    verification: string;
    sortOrder: number;
    sources: { name: string; url: string }[];
  };
  const articleRows: ArticleRow[] = [];

  for (const section of input.sections) {
    let order = 0;
    for (const item of section.items) {
      let id = item.id?.trim() || randomId(section.category);
      if (usedIds.has(id)) id = randomId(section.category);
      usedIds.add(id);
      const slug = item.slug?.trim() || slugify(item.headline);

      articleRows.push({
        id,
        slug,
        category: section.category,
        headline: item.headline,
        summary: item.summary,
        content: item.content ?? null,
        imageUrl: item.imageUrl ?? null,
        importance: item.importance ?? "regular",
        verification: item.verification ?? "confirmed",
        sortOrder: order,
        sources: item.sources ?? [],
      });
      order += 1;
    }
  }

  if (input.leadStoryId && !usedIds.has(input.leadStoryId)) {
    throw Object.assign(
      new Error(`leadStoryId "${input.leadStoryId}" does not match any article id`),
      { code: "INVALID_LEAD" }
    );
  }

  // Article ids are globally unique, but feeds naturally reuse ids like
  // "technology-001" every day. Suffix colliding ids with the edition date.
  let leadStoryId = input.leadStoryId ?? null;
  const incomingIds = articleRows.map((a) => a.id);
  if (incomingIds.length > 0) {
    const taken = (await sql`
      SELECT id FROM articles WHERE id = ANY(${incomingIds})
    `) as unknown as { id: string }[];
    if (taken.length > 0) {
      const takenSet = new Set(taken.map((r) => r.id));
      for (const a of articleRows) {
        if (!takenSet.has(a.id)) continue;
        let next = `${a.id}-${input.date}`;
        while (usedIds.has(next)) next = randomId(a.category);
        usedIds.add(next);
        if (leadStoryId === a.id) leadStoryId = next;
        a.id = next;
      }
    }
  }

  // Reserve the edition id up front so article rows can reference it inside
  // the same non-interactive transaction (edition/article FK is DEFERRED,
  // so insert order across the batch doesn't matter).
  const editionId = crypto.randomUUID();

  const statements = [
    sql`
      INSERT INTO editions (id, date, title, daily_summary, lead_story_id)
      VALUES (${editionId}, ${input.date}, ${input.title}, ${input.dailySummary ?? ""}, ${leadStoryId})
    `,
    ...articleRows.map(
      (a) => sql`
        INSERT INTO articles
          (id, edition_id, slug, category, headline, summary, content, image_url, importance, verification, sort_order)
        VALUES (${a.id}, ${editionId}, ${a.slug}, ${a.category}, ${a.headline}, ${a.summary}, ${a.content}, ${a.imageUrl}, ${a.importance}, ${a.verification}, ${a.sortOrder})
      `
    ),
    ...articleRows.flatMap((a) =>
      a.sources.map(
        (s) => sql`INSERT INTO sources (article_id, name, url) VALUES (${a.id}, ${s.name}, ${s.url})`
      )
    ),
  ];

  try {
    await sql.transaction(statements);
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      err.code === "23505" &&
      "constraint" in err &&
      err.constraint === "editions_date_key"
    ) {
      throw Object.assign(new Error(`Edition for date ${input.date} already exists`), {
        code: "EDITION_EXISTS",
      });
    }
    throw err;
  }

  return (await getEditionByDate(input.date))!;
}

export async function deleteEdition(date: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`DELETE FROM editions WHERE date = ${date} RETURNING id`;
  return rows.length > 0;
}

export async function updateEditionMeta(
  date: string,
  updates: { title?: string; dailySummary?: string; leadStoryId?: string | null }
): Promise<Edition | null> {
  const sql = getSql();
  const existing = await getEditionByDate(date);
  if (!existing) return null;

  if (updates.title !== undefined) {
    await sql`UPDATE editions SET title = ${updates.title}, updated_at = now() WHERE date = ${date}`;
  }
  if (updates.dailySummary !== undefined) {
    await sql`UPDATE editions SET daily_summary = ${updates.dailySummary}, updated_at = now() WHERE date = ${date}`;
  }
  if (updates.leadStoryId !== undefined) {
    await sql`UPDATE editions SET lead_story_id = ${updates.leadStoryId}, updated_at = now() WHERE date = ${date}`;
  }

  return getEditionByDate(date);
}

export async function updateArticle(
  articleId: string,
  updates: {
    headline?: string;
    summary?: string;
    content?: string | null;
    imageUrl?: string | null;
    importance?: string;
    verification?: string;
    sources?: { name: string; url: string }[];
  }
): Promise<void> {
  const sql = getSql();

  if (updates.headline !== undefined) {
    await sql`UPDATE articles SET headline = ${updates.headline}, updated_at = now() WHERE id = ${articleId}`;
  }
  if (updates.summary !== undefined) {
    await sql`UPDATE articles SET summary = ${updates.summary}, updated_at = now() WHERE id = ${articleId}`;
  }
  if (updates.content !== undefined) {
    await sql`UPDATE articles SET content = ${updates.content}, updated_at = now() WHERE id = ${articleId}`;
  }
  if (updates.imageUrl !== undefined) {
    await sql`UPDATE articles SET image_url = ${updates.imageUrl}, updated_at = now() WHERE id = ${articleId}`;
  }
  if (updates.importance !== undefined) {
    await sql`UPDATE articles SET importance = ${updates.importance}, updated_at = now() WHERE id = ${articleId}`;
  }
  if (updates.verification !== undefined) {
    await sql`UPDATE articles SET verification = ${updates.verification}, updated_at = now() WHERE id = ${articleId}`;
  }

  if (updates.sources !== undefined) {
    const sources = updates.sources;
    await sql.transaction([
      sql`DELETE FROM sources WHERE article_id = ${articleId}`,
      ...sources.map(
        (s) => sql`INSERT INTO sources (article_id, name, url) VALUES (${articleId}, ${s.name}, ${s.url})`
      ),
    ]);
  }
}

export async function deleteArticle(articleId: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM articles WHERE id = ${articleId}`;
}

export async function reorderArticles(
  _editionDate: string,
  category: Category,
  orderedIds: string[]
): Promise<void> {
  const sql = getSql();
  if (orderedIds.length === 0) return;
  await sql.transaction(
    orderedIds.map(
      (id, i) =>
        sql`UPDATE articles SET sort_order = ${i} WHERE id = ${id} AND category = ${category}`
    )
  );
}

export async function getArticleBySlug(
  date: string,
  slug: string
): Promise<{ edition: Edition; article: Article } | null> {
  const edition = await getEditionByDate(date);
  if (!edition) return null;
  for (const section of edition.sections) {
    const article = section.items.find((a) => a.slug === slug);
    if (article) return { edition, article };
  }
  return null;
}
