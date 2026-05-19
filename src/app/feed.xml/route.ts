import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { origin } = new URL(request.url);
    const filePath = join(process.cwd(), "data", "welcome-feed.xml");
    const content = readFileSync(filePath, "utf-8");

    const now = new Date().toUTCString();
    const xml = content
      .replaceAll("{{NOW}}", now)
      .replaceAll("http://localhost:3000", origin);

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[feed.xml route]", error);
    return new NextResponse("Error generating feed", { status: 500 });
  }
}
