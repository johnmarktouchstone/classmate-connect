import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { sendSubmissionToMake } from "@/lib/make-submissions";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const unauthorizedResponse = assertAdminRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const body = await request.json();
  const submissionId = String(body.submission_id ?? "");

  if (!submissionId) {
    return NextResponse.json({ error: "submission_id is required." }, { status: 400 });
  }

  try {
    const submission = await sendSubmissionToMake(createServiceSupabaseClient(), submissionId);
    return NextResponse.json({ submission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send submission to Make.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
