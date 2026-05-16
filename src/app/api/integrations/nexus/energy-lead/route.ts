import { NextResponse } from "next/server";
import { sendEnergyAssessmentLeadToNexus } from "@/lib/integrations/nexus/client";
import { energyAssessmentLeadSchema } from "@/lib/integrations/nexus/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = energyAssessmentLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload", details: parsed.error.format() }, { status: 400 });
  }

  if (parsed.data.assessment.demo && process.env.ALLOW_DEMO_INTEGRATION !== "true") {
    return NextResponse.json({ ok: true, skipped: true, reason: "demo_assessment" });
  }

  const result = await sendEnergyAssessmentLeadToNexus(parsed.data);
  const status = result.ok ? 200 : 502;
  return NextResponse.json(result, { status });
}
