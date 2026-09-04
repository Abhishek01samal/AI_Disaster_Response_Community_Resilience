import { NextResponse } from "next/server";
import { ingestLivePicture } from "@/lib/live-ingest";

export async function POST(req: Request) {
  const body = (await req.json()) as { query?: string };
  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  const { snapshot, sources } = await ingestLivePicture(query);
  return NextResponse.json({
    snapshot,
    sources,
    reply: `Console, Incident Map, Relief, and Situation now show live public sources for ${snapshot.regionName}.`,
  });
}
