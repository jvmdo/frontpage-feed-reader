import { NextResponse } from "next/server";
import { getWelcomeFeedXml } from "@/services/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { origin } = new URL(request.url);
    const xml = getWelcomeFeedXml(origin);

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
