import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import {
  normalizeInstagramHandle,
  validateSubmissionInput
} from "@/lib/submission-validation";
import { getDefaultPostingTier, getPostingTier } from "@/lib/posting-tiers";
import { applyPromoCode, normalizePromoCode } from "@/lib/promo-codes";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = {
      school: String(body.school ?? ""),
      fullName: String(body.full_name ?? ""),
      email: String(body.email ?? ""),
      instagramHandle: normalizeInstagramHandle(String(body.instagram_handle ?? "")),
      caption: String(body.caption ?? ""),
      imageUrls: Array.isArray(body.image_urls) ? body.image_urls.map(String) : [],
      consent: Boolean(body.consent),
      postingTier: String(body.posting_tier ?? ""),
      promoCode: normalizePromoCode(String(body.promo_code ?? ""))
    };

    const validationError = validateSubmissionInput(input);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const postingTier = getPostingTier(input.postingTier) ?? getDefaultPostingTier();
    const promo = input.promoCode ? applyPromoCode(postingTier.priceCents, input.promoCode) : null;

    if (input.promoCode && !promo) {
      return NextResponse.json({ error: "Promo code is invalid." }, { status: 400 });
    }

    const finalPriceCents = promo?.finalPriceCents ?? postingTier.priceCents;

    const { data, error } = await createServiceSupabaseClient()
      .from("submissions")
      .insert({
        school: input.school,
        full_name: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        instagram_handle: input.instagramHandle.trim(),
        caption: input.caption.trim(),
        image_urls: input.imageUrls,
        payment_status: "unpaid",
        post_status: "unpaid",
        posting_tier: postingTier.id,
        posting_speed: postingTier.speedLabel,
        price_cents: finalPriceCents,
        original_price_cents: postingTier.priceCents,
        discount_cents: promo?.discountCents ?? 0,
        promo_code: promo?.code ?? null
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not create submission." },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission_id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create submission.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
