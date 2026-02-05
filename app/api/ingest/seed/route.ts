import { NextResponse } from "next/server";
import { mockBanks } from "@/lib/mock-data";

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: `Seeded ${mockBanks.length} banks and computed scores (mock data)`,
      banks: mockBanks,
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    );
  }
}
