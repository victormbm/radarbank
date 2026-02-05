import { NextResponse } from "next/server";
import { mockBanks, mockBankDetails } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const bank = mockBanks.find((b) => b.id === id);

    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    const details = mockBankDetails[id as keyof typeof mockBankDetails];

    return NextResponse.json({
      bank,
      score: bank.score,
      breakdown: details?.breakdown ?? null,
      lastScoreDate: bank.lastScoreDate,
      metrics: details?.metrics ?? [],
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank details" },
      { status: 500 }
    );
  }
}
