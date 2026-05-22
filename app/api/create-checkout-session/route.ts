import { NextRequest, NextResponse } from "next/server";
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
      .select("id, school, email, full_name, payment_status")
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
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: getCheckoutProductName(submission.school)
            },
            recurring: {
              interval: "month"
            },
            unit_amount: getPostPriceCents()
          },
          quantity: 1
        }
      ],
      metadata: {
        submission_id: submission.id
      },
      mode: "subscription",
      subscription_data: {
        metadata: {
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
