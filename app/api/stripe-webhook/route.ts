import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireEnv } from "@/lib/env";
import { sendSubmissionToMake } from "@/lib/make-submissions";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const submissionId = session.metadata?.submission_id;

    if (!submissionId) {
      return NextResponse.json({ received: true });
    }

    const supabase = createServiceSupabaseClient();
    const { error } = await supabase
      .from("submissions")
      .update({
        payment_status: "paid",
        post_status: "needs_review"
      })
      .eq("id", submissionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (session.metadata?.posting_tier === "instant") {
      try {
        await sendSubmissionToMake(supabase, submissionId);
      } catch {
        // The helper marks the submission failed with an error message.
        // Stripe should still receive 200 so it does not keep retrying the payment webhook.
      }
    }
  }

  return NextResponse.json({ received: true });
}
