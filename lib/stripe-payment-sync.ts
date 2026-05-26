import { after } from "next/server";
import { sendInstantSubmissionToMakeAfterDelay } from "@/lib/make-submissions";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

type SyncPaymentResult = {
  error?: string;
  paid?: boolean;
  submissionId?: string;
};

function isPaidCheckoutSession(paymentStatus: string | null) {
  return paymentStatus === "paid" || paymentStatus === "no_payment_required";
}

export async function syncPaidCheckoutSession(sessionId: string): Promise<SyncPaymentResult> {
  if (!sessionId) {
    return { error: "Missing Stripe session ID." };
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!isPaidCheckoutSession(session.payment_status)) {
    return { paid: false, submissionId: session.metadata?.submission_id };
  }

  const submissionId = session.metadata?.submission_id;

  if (!submissionId) {
    return { error: "Stripe session is missing submission metadata." };
  }

  const supabase = createServiceSupabaseClient();
  const { data: existingSubmission, error: loadError } = await supabase
    .from("submissions")
    .select("id, post_status, posting_tier")
    .eq("id", submissionId)
    .single();

  if (loadError || !existingSubmission) {
    return { error: loadError?.message ?? "Submission not found." };
  }

  const shouldSendInstant =
    existingSubmission.posting_tier === "instant" &&
    !["sent_to_make", "posted", "failed"].includes(existingSubmission.post_status);

  const { error: updateError } = await supabase
    .from("submissions")
    .update({
      payment_status: "paid",
      post_status: shouldSendInstant ? "needs_review" : "needs_review",
      stripe_session_id: session.id,
    })
    .eq("id", submissionId);

  if (updateError) {
    return { error: updateError.message };
  }

  if (shouldSendInstant) {
    after(async () => {
      try {
        await sendInstantSubmissionToMakeAfterDelay(submissionId);
      } catch {
        // The helper marks the submission failed with an error message.
      }
    });
  }

  return { paid: true, submissionId };
}
