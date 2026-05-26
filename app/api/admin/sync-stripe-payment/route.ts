import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { syncPaidCheckoutSession } from "@/lib/stripe-payment-sync";

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
  const { data: submission, error: loadError } = await supabase
    .from("submissions")
    .select("stripe_session_id")
    .eq("id", submissionId)
    .single();

  if (loadError || !submission) {
    return NextResponse.json(
      { error: loadError?.message ?? "Submission not found." },
      { status: 404 }
    );
  }

  if (!submission.stripe_session_id) {
    return NextResponse.json(
      { error: "This submission does not have a Stripe session to sync." },
      { status: 400 }
    );
  }

  const syncResult = await syncPaidCheckoutSession(submission.stripe_session_id);

  if (syncResult.error) {
    return NextResponse.json({ error: syncResult.error }, { status: 500 });
  }

  if (!syncResult.paid) {
    return NextResponse.json(
      { error: "Stripe does not show this checkout session as paid yet." },
      { status: 409 }
    );
  }

  const { data: updatedSubmission, error: reloadError } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (reloadError || !updatedSubmission) {
    return NextResponse.json(
      { error: reloadError?.message ?? "Unable to reload submission." },
      { status: 500 }
    );
  }

  return NextResponse.json({ submission: updatedSubmission });
}
