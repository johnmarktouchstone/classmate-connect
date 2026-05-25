import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { formatCaptionForInstagram } from "@/lib/caption";
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
  post_status: string;
  posting_tier: string | null;
  posting_speed: string | null;
  price_cents: number | null;
};

function buildMakePayload(submission: SubmissionForMake) {
  const files = submission.image_urls.map((url) => ({
    media_type: "IMAGE",
    image_url: url,
    photo_url: url,
    url
  }));

  return {
    submission_id: submission.id,
    school: submission.school,
    caption: formatCaptionForInstagram(submission.caption, submission.instagram_handle),
    original_caption: submission.caption,
    image_urls: submission.image_urls,
    image_count: submission.image_urls.length,
    first_image_url: submission.image_urls[0] ?? null,
    files,
    full_name: submission.full_name,
    email: submission.email,
    instagram_handle: submission.instagram_handle,
    posting_tier: submission.posting_tier,
    posting_speed: submission.posting_speed,
    price_cents: submission.price_cents
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
    .select("id, school, full_name, email, instagram_handle, caption, image_urls, payment_status, post_status, posting_tier, posting_speed, price_cents")
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
    const { error: markSentError } = await supabase
      .from("submissions")
      .update({
        error_message: null,
        make_sent_at: new Date().toISOString(),
        post_status: "sent_to_make"
      })
      .eq("id", submission.id);

    if (markSentError) {
      return NextResponse.json(
        { error: markSentError.message },
        { status: 500 }
      );
    }

    const makeResponse = await fetch(requireEnv("MAKE_POST_WEBHOOK_URL"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!makeResponse.ok) {
      throw new Error(`Make returned ${makeResponse.status}.`);
    }

    const { data, error: reloadError } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", submission.id)
      .single();

    if (reloadError || !data) {
      return NextResponse.json(
        { error: reloadError?.message ?? "Could not reload submission after sending to Make." },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission: data });
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Could not send submission to Make.";
    await supabase
      .from("submissions")
      .update({
        error_message: message,
        post_status: "failed"
      })
      .eq("id", submission.id)
      .neq("post_status", "posted");

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
