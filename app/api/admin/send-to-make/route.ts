import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { requireEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type SubmissionForMake = {
  id: string;
  school: string;
  full_name: string;
  email: string;
  instagram_handle: string;
  caption: string;
  image_urls: string[];
  payment_status: string;
};

function buildMakePayload(submission: SubmissionForMake) {
  return {
    submission_id: submission.id,
    school: submission.school,
    caption: submission.caption,
    image_urls: submission.image_urls,
    full_name: submission.full_name,
    email: submission.email,
    instagram_handle: submission.instagram_handle
  };
}

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

  const supabase = createServiceSupabaseClient();
  const { data: submission, error } = await supabase
    .from("submissions")
    .select("id, school, full_name, email, instagram_handle, caption, image_urls, payment_status")
    .eq("id", submissionId)
    .single();

  if (error || !submission) {
    return NextResponse.json(
      { error: error?.message ?? "Submission not found." },
      { status: 404 }
    );
  }

  const payload = buildMakePayload(submission);

  try {
    const makeResponse = await fetch(requireEnv("MAKE_POST_WEBHOOK_URL"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!makeResponse.ok) {
      throw new Error(`Make returned ${makeResponse.status}.`);
    }

    const { data, error: updateError } = await supabase
      .from("submissions")
      .update({
        post_status: "sent_to_make"
      })
      .eq("id", submission.id)
      .select("*")
      .single();

    if (updateError || !data) {
      return NextResponse.json(
        { error: updateError?.message ?? "Could not update submission after sending to Make." },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission: data });
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Could not send submission to Make.";
    await supabase.from("submissions").update({ post_status: "failed" }).eq("id", submission.id);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
