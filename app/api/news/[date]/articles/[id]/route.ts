import { NextRequest, NextResponse } from "next/server";
import { isWriteAuthorized } from "@/lib/auth";
import { deleteArticle, updateArticle } from "@/lib/queries";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ date: string; id: string }> }
) {
  if (!(await isWriteAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  await updateArticle(id, {
    headline: body.headline,
    summary: body.summary,
    content: body.content,
    imageUrl: body.imageUrl,
    importance: body.importance,
    verification: body.verification,
    sources: body.sources,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ date: string; id: string }> }
) {
  if (!(await isWriteAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteArticle(id);
  return NextResponse.json({ success: true });
}
