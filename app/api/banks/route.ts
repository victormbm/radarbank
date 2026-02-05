import { NextResponse } from "next/server";
import { mockBanks } from "@/lib/mock-data";

export async function GET() {
  try {
    return NextResponse.json(mockBanks);
  } catch (error) {
    console.error("Error fetching banks:", error);
    return NextResponse.json(
      { error: "Failed to fetch banks" },
      { status: 500 }
    );
  }
}
