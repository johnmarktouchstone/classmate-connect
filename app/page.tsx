import Link from "next/link";
import { schools } from "@/lib/schools";

export default function Home() {
  return (
    <main className="min-h-screen bg-linen px-4 py-10 text-ink">
      <section className="mx-auto grid max-w-4xl gap-8">
        <div className="rounded-lg bg-white p-6 shadow-soft sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">ClassMate Connect</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Freshman intro submissions, organized.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
            Choose a school page to test the student submission flow for Class of 2031 accounts.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {schools.map((school) => (
            <Link
              className="rounded-lg bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
              href={`/${school.publicSlug}`}
              key={school.slug}
            >
              <h2 className="text-xl font-bold">{school.displayName}</h2>
              <p className="mt-1 text-sm text-ink/60">{school.instagramUsername}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
