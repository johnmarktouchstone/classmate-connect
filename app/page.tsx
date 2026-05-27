import Link from "next/link";
import { CircleHelp, Info, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { SchoolDirectory } from "@/components/SchoolDirectory";
import { schools } from "@/lib/schools";

export default function Home() {
  return (
    <main className="min-h-screen bg-linen text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex items-center gap-3" href="/">
            <img
              alt="ClassMate Connect"
              className="h-11 w-11 object-contain"
              src="/classmate-connect-logo.png"
            />
            <span className="text-lg font-black uppercase tracking-wide text-brand">ClassMate Connect</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
            <a className="inline-flex h-10 items-center gap-2 rounded-md px-3 transition hover:bg-white hover:text-brand" href="#about">
              <Info className="h-4 w-4" aria-hidden="true" />
              About
            </a>
            <a className="inline-flex h-10 items-center gap-2 rounded-md px-3 transition hover:bg-white hover:text-brand" href="mailto:hello@classmateconnect.org">
              <CircleHelp className="h-4 w-4" aria-hidden="true" />
              Help
            </a>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 font-bold text-brand shadow-sm transition hover:border-brand/30 hover:shadow-md"
              href="/admin"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Admin
            </Link>
          </div>
        </nav>

        <section
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft"
          id="about"
        >
          <div className="grid min-h-[430px] items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
            <div>
              <div className="inline-flex rounded-full bg-brand/10 px-4 py-2 text-sm font-black uppercase tracking-wide text-brand">
                Class of 2031
              </div>
              <h1 className="mt-8 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Your Class of 2031 <span className="text-brand">starts here.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Post your intro, meet future classmates, and find people you&apos;d actually want to room with before freshman year begins.
              </p>

              <div className="mt-8 grid gap-4 text-sm font-bold text-slate-700 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </span>
                  All your schools
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  Secure and private
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  </span>
                  Easy to manage
                </div>
              </div>
            </div>

            <div className="relative hidden min-h-[330px] lg:block">
              <div className="absolute right-4 top-8 h-8 w-24 rounded-full bg-slate-50" />
              <div className="absolute right-0 top-4 h-12 w-12 rounded-full bg-slate-50" />
              <div className="absolute right-20 top-3 h-10 w-10 rounded-full bg-slate-50" />
              <div className="absolute left-12 top-24 h-7 w-20 rounded-full bg-slate-50" />
              <div className="absolute left-20 top-16 h-14 w-14 rounded-full bg-slate-50" />
              <div className="absolute bottom-8 right-0 h-5 w-full rounded-full bg-brand/10" />
              <div className="absolute bottom-8 right-14 w-[430px] max-w-full">
                <div className="mx-auto h-0 w-0 border-x-[150px] border-b-[86px] border-x-transparent border-b-brand/20" />
                <div className="mx-auto flex h-28 w-[360px] items-end justify-center gap-5 rounded-t-lg bg-brand/10 px-8 pb-0">
                  <div className="h-24 w-10 rounded-t-md bg-white shadow-sm" />
                  <div className="h-24 w-10 rounded-t-md bg-white shadow-sm" />
                  <div className="h-32 w-16 rounded-t-lg bg-gradient-to-b from-brand/70 to-brand" />
                  <div className="h-24 w-10 rounded-t-md bg-white shadow-sm" />
                  <div className="h-24 w-10 rounded-t-md bg-white shadow-sm" />
                </div>
                <div className="mx-auto h-8 w-[410px] rounded-t-sm bg-brand/20" />
                <div className="mx-auto h-6 w-[330px] bg-brand/30" />
                <div className="mx-auto h-6 w-[250px] bg-brand/40" />
              </div>
              <div className="absolute bottom-8 left-8 h-28 w-16 rounded-full bg-brand/40" />
              <div className="absolute bottom-8 left-20 h-20 w-12 rounded-full bg-brand/20" />
              <div className="absolute bottom-8 right-0 h-24 w-14 rounded-full bg-brand/20" />
            </div>
          </div>
        </section>

        <SchoolDirectory schools={schools} />

        <footer className="flex flex-col items-center justify-center gap-3 pb-4 text-sm font-semibold text-slate-500 sm:flex-row sm:gap-8">
          <span>© 2026 ClassMate Connect. All rights reserved.</span>
          <a className="text-brand transition hover:text-brand-dark" href="mailto:hello@classmateconnect.org?subject=Privacy%20Policy">
            Privacy Policy
          </a>
          <a className="text-brand transition hover:text-brand-dark" href="mailto:hello@classmateconnect.org?subject=Terms%20of%20Service">
            Terms of Service
          </a>
        </footer>
      </div>
    </main>
  );
}
