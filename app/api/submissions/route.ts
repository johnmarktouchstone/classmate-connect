import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import {
  normalizeInstagramHandle,
  validateSubmissionInput
} from "@/lib/submission-validation";

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
      consent: Boolean(body.consent)
    };

    const validationError = validateSubmissionInput(input);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

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
        post_status: "unpaid"
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
