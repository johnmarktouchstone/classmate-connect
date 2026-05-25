import { formatCaptionForInstagram } from "@/lib/caption";
import { requireEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { Submission } from "@/lib/submissions";

type ServiceSupabaseClient = ReturnType<typeof createServiceSupabaseClient>;

type SubmissionForMake = Pick<
  Submission,
  | "id"
  | "school"
  | "full_name"
  | "email"
  | "instagram_handle"
  | "caption"
  | "image_urls"
  | "payment_status"
  | "post_status"
  | "posting_tier"
  | "posting_speed"
  | "price_cents"
  | "original_price_cents"
  | "discount_cents"
  | "promo_code"
>;

const submissionForMakeSelect =
  "id, school, full_name, email, instagram_handle, caption, image_urls, payment_status, post_status, posting_tier, posting_speed, price_cents, original_price_cents, discount_cents, promo_code";

export function buildMakePayload(submission: SubmissionForMake) {
  const files = submission.image_urls.map((url) => ({
    media_type: "IMAGE",
    image_url: url,
    photo_url: url,
    url,
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
    price_cents: submission.price_cents,
    original_price_cents: submission.original_price_cents,
    discount_cents: submission.discount_cents,
    promo_code: submission.promo_code,
  };
}

export async function sendSubmissionToMake(
  supabase: ServiceSupabaseClient,
  submissionId: string,
) {
  const { data: submission, error } = await supabase
    .from("submissions")
    .select(submissionForMakeSelect)
    .eq("id", submissionId)
    .single();

  if (error || !submission) {
    throw new Error(error?.message ?? "Submission not found.");
  }

  const payload = buildMakePayload(submission);

  try {
    const { error: markSentError } = await supabase
      .from("submissions")
      .update({
        error_message: null,
        make_sent_at: new Date().toISOString(),
        post_status: "sent_to_make",
      })
      .eq("id", submission.id);

    if (markSentError) {
      throw new Error(markSentError.message);
    }

    const makeResponse = await fetch(requireEnv("MAKE_POST_WEBHOOK_URL"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      throw new Error(reloadError?.message ?? "Could not reload submission after sending to Make.");
    }

    return data as Submission;
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Could not send submission to Make.";
    await supabase
      .from("submissions")
      .update({
        error_message: message,
        post_status: "failed",
      })
      .eq("id", submission.id)
      .neq("post_status", "posted");

    throw new Error(message);
  }
}
