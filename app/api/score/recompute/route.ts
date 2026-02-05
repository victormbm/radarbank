import { NextResponse } from "next/server";
import { mockBanks } from "@/lib/mock-data";

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: `Recomputed scores for ${mockBanks.length} banks (mock data)`,
      scores: mockBanks.map((b) => ({
        id: b.id,
        bankId: b.id,
        totalScore: b.score,
        date: b.lastScoreDate,
      })),
    });
  } catch (error) {
    console.error("Error recomputing scores:", error);
    return NextResponse.json(
      { error: "Failed to recompute scores" },
      { status: 500 }
    );
  }
}
