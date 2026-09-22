import { NextRequest, NextResponse } from "next/server";
import { checkApiKey } from "@/lib/auth";
import {
  createEdition,
  getEditionByDate,
  getLatestEdition,
  listEditionDates,
} from "@/lib/queries";
import { isCategory } from "@/lib/categories";
import { EditionInput } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Internal error";
}

function errorCode(err: unknown): string | undefined {
  return err instanceof Error && "code" in err ? String((err as { code?: unknown }).code) : undefined;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const latest = searchParams.get("latest");
  const archive = searchParams.get("archive");

  try {
    if (archive === "true") {
      const list = await listEditionDates();
      return NextResponse.json({ editions: list });
    }

    if (latest === "true") {
      const edition = await getLatestEdition();
      if (!edition) {
        return NextResponse.json({ error: "No editions published yet" }, { status: 404 });
      }
      return NextResponse.json(edition);
    }

    if (date) {
      if (!DATE_RE.test(date)) {
        return NextResponse.json({ error: "Invalid date format, expected YYYY-MM-DD" }, { status: 400 });
      }
      const edition = await getEditionByDate(date);
      if (!edition) {
        return NextResponse.json({ error: `No edition found for ${date}` }, { status: 404 });
      }
      return NextResponse.json(edition);
    }

    return NextResponse.json(
      { error: "Provide one of: date=YYYY-MM-DD, latest=true, archive=true" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: EditionInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.date || !DATE_RE.test(body.date)) {
    return NextResponse.json({ error: "date is required, format YYYY-MM-DD" }, { status: 400 });
  }
  if (!body.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!Array.isArray(body.sections)) {
    return NextResponse.json({ error: "sections must be an array" }, { status: 400 });
  }
  for (const section of body.sections) {
    if (!isCategory(section.category)) {
      return NextResponse.json(
        { error: `Invalid category "${section.category}"` },
        { status: 400 }
      );
    }
    if (!Array.isArray(section.items)) {
      return NextResponse.json({ error: `section "${section.category}" items must be an array` }, { status: 400 });
    }
    for (const item of section.items) {
      if (!item.headline || !item.summary) {
        return NextResponse.json(
          { error: `Each article requires headline and summary (category: ${section.category})` },
          { status: 400 }
        );
      }
      if (!item.sources || item.sources.length === 0) {
        return NextResponse.json(
          { error: `Article "${item.headline}" requires at least one source` },
          { status: 400 }
        );
      }
    }
  }

  try {
    const edition = await createEdition(body);
    return NextResponse.json(edition, { status: 201 });
  } catch (err) {
    const code = errorCode(err);
    if (code === "EDITION_EXISTS") {
      return NextResponse.json({ error: errorMessage(err) }, { status: 409 });
    }
    if (code === "INVALID_LEAD") {
      return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
