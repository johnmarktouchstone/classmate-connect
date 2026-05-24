import { NextRequest, NextResponse } from "next/server";
import { getDefaultPostingTier, getPostingTier } from "@/lib/posting-tiers";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getPostPriceCents, getStripe } from "@/lib/stripe";

function getCheckoutProductName(school: string) {
  const classYear = school.match(/20\d{2}/)?.[0] ?? "2031";
  return `${classYear} Post!`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const submissionId = String(body.submission_id ?? "");

    if (!submissionId) {
      return NextResponse.json({ error: "submission_id is required." }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();
    const { data: submission, error } = await supabase
      .from("submissions")
      .select("id, school, email, full_name, payment_status, posting_tier, posting_speed, price_cents")
      .eq("id", submissionId)
      .single();

    if (error || !submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    if (submission.payment_status === "paid") {
      return NextResponse.json({ error: "This submission has already been paid." }, { status: 409 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    const stripe = getStripe();
    const configuredTier = getPostingTier(submission.posting_tier);
    const fallbackTier = getDefaultPostingTier();
    const tierLabel = configuredTier?.label ?? fallbackTier.label;
    const postingSpeed = submission.posting_speed ?? configuredTier?.speedLabel ?? fallbackTier.speedLabel;
    const priceCents = submission.price_cents ?? configuredTier?.priceCents ?? getPostPriceCents();

    const session = await stripe.checkout.sessions.create({
      customer_email: submission.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              description: postingSpeed,
              name: `${getCheckoutProductName(submission.school)} - ${tierLabel}`
            },
            recurring: {
              interval: "month"
            },
            unit_amount: priceCents
          },
          quantity: 1
        }
      ],
      metadata: {
        posting_speed: postingSpeed,
        posting_tier: submission.posting_tier ?? fallbackTier.id,
        price_cents: String(priceCents),
        submission_id: submission.id
      },
      mode: "subscription",
      subscription_data: {
        metadata: {
          posting_speed: postingSpeed,
          posting_tier: submission.posting_tier ?? fallbackTier.id,
          price_cents: String(priceCents),
          submission_id: submission.id
        }
      },
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
