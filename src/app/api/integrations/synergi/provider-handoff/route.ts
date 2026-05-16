import { NextResponse } from "next/server";
import { sendProviderHandoffToSynergi } from "@/lib/integrations/synergi/client";
import { providerHandoffRequestSchema } from "@/lib/integrations/synergi/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = providerHandoffRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload", details: parsed.error.format() }, { status: 400 });
  }

  if (parsed.data.assessment.demo && process.env.ALLOW_DEMO_INTEGRATION !== "true") {
    return NextResponse.json({ ok: true, skipped: true, reason: "demo_assessment" });
  }

  const result = await sendProviderHandoffToSynergi(parsed.data);
  const status = result.ok ? 200 : 502;
  return NextResponse.json(result, { status });
}
