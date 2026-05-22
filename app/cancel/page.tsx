import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-linen px-4 py-10 text-ink">
      <section className="w-full max-w-lg rounded-lg bg-white p-6 text-center shadow-soft sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Payment canceled</p>
        <h1 className="mt-3 text-3xl font-bold">Payment was not completed.</h1>
        <p className="mt-3 text-ink/70">
          Payment was not completed. Your submission has not been added to the posting queue.
        </p>
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
