import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const allowedMakeStatuses = ["posted", "failed"] as const;

type MakeStatus = (typeof allowedMakeStatuses)[number];

function isMakeStatus(value: string): value is MakeStatus {
  return allowedMakeStatuses.includes(value as MakeStatus);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submissionId = String(body.submission_id ?? "");
    const status = String(body.status ?? "");
    const errorMessage = body.error_message ? String(body.error_message) : null;

    if (!submissionId) {
      return NextResponse.json({ error: "submission_id is required." }, { status: 400 });
    }

    if (!isMakeStatus(status)) {
      return NextResponse.json({ error: "status must be posted or failed." }, { status: 400 });
    }

    const updateValues: {
      post_status: MakeStatus;
      posted_at?: string;
      error_message?: string | null;
    } = {
      post_status: status
    };

    if (status === "posted") {
      updateValues.posted_at = new Date().toISOString();
      updateValues.error_message = null;
    }

    if (status === "failed") {
      updateValues.error_message = errorMessage ?? "Make reported a posting failure.";
    }

    const { data, error } = await createServiceSupabaseClient()
      .from("submissions")
      .update(updateValues)
      .eq("id", submissionId)
      .select("id, post_status, posted_at, error_message")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not update submission status." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, submission: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process Make status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
