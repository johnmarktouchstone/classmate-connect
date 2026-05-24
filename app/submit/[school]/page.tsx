import { notFound } from "next/navigation";
import { SubmitForm } from "@/components/SubmitForm";
import { getSchool } from "@/lib/schools";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ school: string }>;
}) {
  const { school: schoolSlug } = await params;
  const school = getSchool(schoolSlug);

  if (!school) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-linen px-4 py-6 text-ink sm:py-10">
      <section className="mx-auto grid max-w-6xl gap-6">
        <header className="rounded-lg bg-white p-5 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            ClassMate Connect
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {school.displayName}!
          </h1>
          <p className="mt-3 text-base leading-7 text-ink/70">
            Complete this form to be featured! DM us with any questions!
          </p>
        </header>

        <SubmitForm school={school} />
      </section>
    </main>
  );
}
