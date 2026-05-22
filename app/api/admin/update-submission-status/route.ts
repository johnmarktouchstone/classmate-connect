import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isPostStatus } from "@/lib/submissions";

export async function POST(request: Request) {
  const unauthorizedResponse = assertAdminRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const body = await request.json();
  const submissionId = String(body.submission_id ?? "");
  const postStatus = String(body.post_status ?? "");

  if (!submissionId) {
    return NextResponse.json({ error: "submission_id is required." }, { status: 400 });
  }

  if (!isPostStatus(postStatus)) {
    return NextResponse.json({ error: "post_status is invalid." }, { status: 400 });
  }

  const updateValues: Record<string, string | null> = {
    post_status: postStatus
  };

  if (postStatus === "posted") {
    updateValues.posted_at = new Date().toISOString();
  }

  const { data, error } = await createServiceSupabaseClient()
    .from("submissions")
    .update(updateValues)
    .eq("id", submissionId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not update submission." },
      { status: 500 }
    );
  }

  return NextResponse.json({ submission: data });
}
