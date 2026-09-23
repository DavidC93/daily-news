import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { createEdition, editionExists, getLatestEditionDate } from "@/lib/queries";
import { parsePastedJson, validateEdition } from "@/lib/editionValidation";

// Admin-session-only endpoint behind /admin/publish. Takes the raw pasted
// text so cleanup and validation live in one place on the server.
//   { action: "check" | "publish", json: string }
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "פג תוקף ההתחברות. יש להתחבר מחדש." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (typeof body?.json !== "string" || (action !== "check" && action !== "publish")) {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const parsed = parsePastedJson(body.json);
  if (!parsed.ok) return NextResponse.json({ errors: [parsed.error] }, { status: 422 });

  const result = validateEdition(parsed.data);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });

  const { edition, preview } = result;

  try {
    if (await editionExists(edition.date)) {
      return NextResponse.json({ exists: true, preview }, { status: 409 });
    }

    if (action === "check") {
      const latest = await getLatestEditionDate();
      if (latest && edition.date < latest) {
        preview.warnings.push("שים לב: כבר פורסמה מהדורה לתאריך מאוחר יותר.");
      }
      return NextResponse.json({ preview });
    }

    await createEdition(edition);
    return NextResponse.json({ published: true, date: edition.date, url: `/edition/${edition.date}` }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "EDITION_EXISTS") {
      return NextResponse.json({ exists: true, preview }, { status: 409 });
    }
    const detail = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: `תקלה בשמירת המהדורה. ${detail}`.trim() }, { status: 500 });
  }
}
