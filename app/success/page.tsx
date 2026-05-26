import Link from "next/link";
import { syncPaidCheckoutSession } from "@/lib/stripe-payment-sync";

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
    tier?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const isInstant = params.tier === "instant";
  const paymentSyncResult = params.session_id
    ? await syncPaidCheckoutSession(params.session_id)
    : null;
  const paymentSyncError = paymentSyncResult?.error;

  return (
    <main className="grid min-h-screen place-items-center bg-linen px-4 py-10 text-ink">
      <section className="w-full max-w-lg rounded-lg bg-white p-6 text-center shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          {isInstant ? "Submission received" : "Payment received"}
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          {isInstant
            ? "Your post will be posted in a few moments."
            : "Your submission is waiting for review."}
        </h1>
        <p className="mt-3 text-ink/70">
          {isInstant
            ? "We received your submission and are sending it to the Instagram page now."
            : "Payment received. Your submission is now waiting for review."}
        </p>
        {paymentSyncError && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Payment was received, but we could not update the dashboard yet. Please contact
            ClassMate Connect.
          </p>
        )}
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2 font-semibold text-white transition hover:bg-brand-dark"
          href="/"
        >
          Back home
        </Link>
      </section>
    </main>
  );
}
