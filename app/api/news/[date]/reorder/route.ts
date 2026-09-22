import { NextRequest, NextResponse } from "next/server";
import { isWriteAuthorized } from "@/lib/auth";
import { reorderArticles } from "@/lib/queries";
import { isCategory } from "@/lib/categories";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  if (!(await isWriteAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { date } = await params;
  const body = await req.json().catch(() => ({}));
  const { category, orderedIds } = body;
  if (!isCategory(category) || !Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "category and orderedIds[] are required" }, { status: 400 });
  }
  await reorderArticles(date, category, orderedIds);
  return NextResponse.json({ success: true });
}
