import { NextResponse } from "next/server";
import { processComplaint } from "@/lib/complaint-processing";

const maxComplaintLength = 5000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { complaint?: unknown };
    const complaint = typeof body.complaint === "string" ? body.complaint.trim() : "";

    if (complaint.length < 30) {
      return NextResponse.json(
        { error: "Complaint must include enough detail for private triage." },
        { status: 400 },
      );
    }

    if (complaint.length > maxComplaintLength) {
      return NextResponse.json(
        { error: `Complaint must be ${maxComplaintLength} characters or fewer.` },
        { status: 400 },
      );
    }

    return NextResponse.json({
      processed: await processComplaint(complaint),
      privacyBoundary: "Only sanitized complaint data should continue to AI triage or admin review.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid complaint processing request." }, { status: 400 });
  }
}
