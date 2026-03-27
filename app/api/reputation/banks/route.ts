import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      mode: "bcb-only",
      message:
        "Modulo de reputacao desativado. O sistema utiliza apenas score baseado em dados do BCB com ajuste por porte.",
      timestamp: new Date().toISOString(),
    },
    { status: 410 }
  );
}
