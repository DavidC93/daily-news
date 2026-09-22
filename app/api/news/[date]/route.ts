import { NextRequest, NextResponse } from "next/server";
import { isWriteAuthorized } from "@/lib/auth";
import { deleteEdition, getEditionByDate, updateEditionMeta } from "@/lib/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const edition = await getEditionByDate(date);
  if (!edition) {
    return NextResponse.json({ error: `No edition found for ${date}` }, { status: 404 });
  }
  return NextResponse.json(edition);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  if (!(await isWriteAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { date } = await params;
  const body = await req.json().catch(() => ({}));
  const updated = await updateEditionMeta(date, {
    title: body.title,
    dailySummary: body.dailySummary,
    leadStoryId: body.leadStoryId,
  });
  if (!updated) {
    return NextResponse.json({ error: `No edition found for ${date}` }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  if (!(await isWriteAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { date } = await params;
  const ok = await deleteEdition(date);
  if (!ok) {
    return NextResponse.json({ error: `No edition found for ${date}` }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
