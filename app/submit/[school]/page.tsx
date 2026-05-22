import { notFound } from "next/navigation";
import { SubmitForm } from "@/components/SubmitForm";
import { getSchool } from "@/lib/schools";

function formatMonthlyPrice() {
  const cents = Number(process.env.POST_PRICE_CENTS ?? "299");
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency"
  }).format(cents / 100);
}

function getSchoolName(displayName: string) {
  return displayName.replace(/\s+Class of 2031$/, "");
}

export default async function SubmitPage({
  params
}: {
  params: Promise<{ school: string }>;
}) {
  const { school: schoolSlug } = await params;
  const school = getSchool(schoolSlug);

  if (!school) {
    notFound();
  }

  const priceLabel = formatMonthlyPrice();
  const schoolName = getSchoolName(school.displayName);

  return (
    <main className="min-h-screen bg-linen px-4 py-6 text-ink sm:py-10">
      <section className="mx-auto grid max-w-3xl gap-6">
        <header className="rounded-lg bg-white p-5 shadow-soft sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get Featured on {school.instagramUsername}
          </h1>
          <p className="mt-3 text-base leading-7 text-ink/70">
            Meet your future {schoolName} classmates before move-in. Submit your photos, caption, and
            Instagram handle to be posted on the {schoolName} Class of 2031 page.
          </p>
        </header>

        <SubmitForm priceLabel={priceLabel} school={school} />
      </section>
    </main>
  );
}
