"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Mail,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { useMemo, useState } from "react";
import type { School } from "@/lib/schools";

type SchoolDirectoryProps = {
  schools: School[];
};

type SortMode = "name" | "students";

export function SchoolDirectory({ schools }: SchoolDirectoryProps) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("name");

  const filteredSchools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return schools
      .filter((school) => {
        if (!normalizedQuery) {
          return true;
        }

        return [school.displayName, school.instagramUsername, school.pageHeading]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((firstSchool, secondSchool) => {
        if (sortMode === "students") {
          return secondSchool.studentCount - firstSchool.studentCount;
        }

        return firstSchool.displayName.localeCompare(secondSchool.displayName);
      });
  }, [query, schools, sortMode]);

  return (
    <section className="grid gap-6" id="schools">
      <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
        <label className="flex h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/10">
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="sr-only">Search schools</span>
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-base font-medium text-ink outline-none placeholder:text-slate-400"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search schools..."
            type="search"
            value={query}
          />
        </label>

        <label className="relative flex h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 shadow-sm focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/10">
          <SlidersHorizontal className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <span className="sr-only">Sort schools</span>
          <select
            className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-8 text-base font-semibold text-ink outline-none"
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            value={sortMode}
          >
            <option value="name">Sort by name</option>
            <option value="students">Sort by students</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-slate-500" aria-hidden="true" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredSchools.map((school) => (
          <Link
            className="group flex min-h-[210px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-brand/15"
            href={`/${school.publicSlug}`}
            key={school.slug}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${school.accentClass} text-lg font-black text-white shadow-lg shadow-slate-200`}
                >
                  {school.initials}
                </span>
                <div>
                  <h2 className="text-lg font-bold leading-6 tracking-tight">{school.displayName}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{school.instagramUsername}</p>
                </div>
              </div>
              <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-ink transition group-hover:translate-x-1 group-hover:text-brand" aria-hidden="true" />
            </div>

            <p className="mt-5 text-base font-medium leading-7 text-slate-600">
              {school.pageHeading}
              <br />
              Class of 2031
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-brand/10 px-3 py-2 text-sm font-bold text-brand">
                {school.studentCount.toLocaleString()} students
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">Class of 2031</span>
            </div>
          </Link>
        ))}
      </div>

      {filteredSchools.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-lg font-bold text-ink">No schools match that search.</p>
          <p className="mt-2 text-sm text-slate-500">Try searching by school name or Instagram handle.</p>
        </div>
      ) : null}

      <div className="grid items-center gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[auto_1fr_auto]">
        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <BookOpen className="h-10 w-10" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Don&apos;t see your school?</h2>
          <p className="mt-2 max-w-xl leading-7 text-slate-600">
            We&apos;re always adding more schools. Send over the account you want connected.
          </p>
        </div>
        <a
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-brand/20 px-5 text-sm font-bold text-brand transition hover:border-brand/40 hover:bg-brand/5"
          href="mailto:hello@classmateconnect.org?subject=Request%20a%20school"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Request a school
        </a>
      </div>
    </section>
  );
}
