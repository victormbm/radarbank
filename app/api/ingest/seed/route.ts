import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Endpoint desabilitado: modo API-only ativo.",
      details: "Use /api/ingest/run ou /api/ingest/bcb para ingestao de dados oficiais do BCB.",
    },
    { status: 410 }
  );
}
