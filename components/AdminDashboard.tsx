"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2, LockKeyhole, RefreshCw, ShieldCheck, X } from "lucide-react";
import { formatTierPrice, postingTiers, type PostingTierId } from "@/lib/posting-tiers";
import { formatStatus, type PostStatus, type Submission } from "@/lib/submissions";

type DashboardTab = "unpaid" | "paid" | "sent_to_make" | "failed" | "posted" | "rejected";
type PaidTierFilter = "all" | PostingTierId;

const dashboardTabs: { id: DashboardTab; label: string }[] = [
  { id: "unpaid", label: "Unpaid" },
  { id: "paid", label: "Paid" },
  { id: "sent_to_make", label: "Sent to Make" },
  { id: "failed", label: "Failed" },
  { id: "posted", label: "Posted" },
  { id: "rejected", label: "Rejected" },
];

const adminPasswordStorageKey = "classmate_admin_password";

const statusStyles: Record<PostStatus, string> = {
  unpaid: "bg-slate-100 text-slate-700",
  needs_review: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-700",
  sent_to_make: "bg-blue-100 text-blue-700",
  posted: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700"
};

function getReviewPriority(submission: Submission) {
  if (submission.payment_status === "unpaid" || submission.post_status === "unpaid") return 0;
  if (submission.payment_status === "paid" && submission.post_status === "needs_review") return 0;
  if (submission.post_status === "needs_review") return 1;
  if (submission.payment_status === "paid") return 2;
  return 3;
}

function sortSubmissions(submissions: Submission[]) {
  return [...submissions].sort((firstSubmission, secondSubmission) => {
    const priorityDifference =
      getReviewPriority(firstSubmission) - getReviewPriority(secondSubmission);

    if (priorityDifference !== 0) return priorityDifference;

    return (
      new Date(secondSubmission.created_at).getTime() -
      new Date(firstSubmission.created_at).getTime()
    );
  });
}

function getApproveLabel(submission: Submission) {
  if (submission.post_status === "sent_to_make") return "Sent to Make";
  if (submission.post_status === "posted") return "Posted";
  return "Approve";
}

function formatSubmittedAt(createdAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

function getTierDisplay(submission: Submission) {
  const tier = postingTiers.find((postingTier) => postingTier.id === submission.posting_tier);

  return {
    label: tier?.label ?? (submission.posting_tier ? formatStatus(submission.posting_tier) : "Not selected"),
    price: formatTierPrice(submission.price_cents),
    speed: submission.posting_speed || tier?.speedLabel || "No timing selected",
  };
}

export function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("paid");
  const [paidTierFilter, setPaidTierFilter] = useState<PaidTierFilter>("all");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  const visibleSubmissions = useMemo(() => {
    let nextSubmissions = submissions.filter((submission) => {
      if (activeTab === "paid") {
        return submission.payment_status === "paid" && submission.post_status === "needs_review";
      }

      if (activeTab === "unpaid") {
        return submission.payment_status === "unpaid" || submission.post_status === "unpaid";
      }

      return submission.post_status === activeTab;
    });

    if (activeTab === "paid" && paidTierFilter !== "all") {
      nextSubmissions = nextSubmissions.filter(
        (submission) => submission.posting_tier === paidTierFilter
      );
    }

    return nextSubmissions;
  }, [activeTab, paidTierFilter, submissions]);

  const counts = useMemo(() => {
    return submissions.reduce<Record<string, number>>(
      (nextCounts, submission) => {
        if (submission.payment_status === "unpaid" || submission.post_status === "unpaid") {
          nextCounts.unpaid += 1;
        }

        if (submission.payment_status === "paid" && submission.post_status === "needs_review") {
          nextCounts.paid += 1;
        }

        if (["sent_to_make", "failed", "posted", "rejected"].includes(submission.post_status)) {
          nextCounts[submission.post_status] = (nextCounts[submission.post_status] ?? 0) + 1;
        }

        return nextCounts;
      },
      {
        failed: 0,
        paid: 0,
        posted: 0,
        rejected: 0,
        sent_to_make: 0,
        unpaid: 0,
      }
    );
  }, [submissions]);

  const paidTierCounts = useMemo(() => {
    return submissions.reduce<Record<string, number>>(
      (nextCounts, submission) => {
        if (submission.payment_status !== "paid" || submission.post_status !== "needs_review") {
          return nextCounts;
        }

        nextCounts.all += 1;
        if (submission.posting_tier) {
          nextCounts[submission.posting_tier] = (nextCounts[submission.posting_tier] ?? 0) + 1;
        }

        return nextCounts;
      },
      { all: 0 }
    );
  }, [submissions]);

  const failedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.post_status === "failed"),
    [submissions]
  );

  async function loadSubmissions(nextPassword = password) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/submissions?status=all", {
        headers: { "x-admin-password": nextPassword }
      });
      const result = (await response.json()) as { submissions?: Submission[]; error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Unable to load submissions.");
      }

      setSubmissions(sortSubmissions(result.submissions ?? []));
      setIsUnlocked(true);
      sessionStorage.setItem(adminPasswordStorageKey, nextPassword);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load submissions.");
      setIsUnlocked(false);
      sessionStorage.removeItem(adminPasswordStorageKey);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(submissionId: string, postStatus: PostStatus) {
    setActionId(submissionId);
    setError("");

    try {
      const response = await fetch("/api/admin/update-submission-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({
          submission_id: submissionId,
          post_status: postStatus
        })
      });
      const result = (await response.json()) as { submission?: Submission; error?: string };

      if (!response.ok || !result.submission) {
        throw new Error(result.error || "Unable to update submission.");
      }

      setSubmissions((currentSubmissions) =>
        sortSubmissions(
          currentSubmissions.map((submission) =>
            submission.id === submissionId ? result.submission! : submission
          )
        )
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update submission.");
    } finally {
      setActionId("");
    }
  }

  async function sendToMake(submissionId: string) {
    setActionId(submissionId);
    setError("");

    try {
      const response = await fetch("/api/admin/send-to-make", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({ submission_id: submissionId })
      });
      const result = (await response.json()) as { submission?: Submission; error?: string };

      if (!response.ok || !result.submission) {
        throw new Error(result.error || "Unable to send submission to Make.");
      }

      setSubmissions((currentSubmissions) =>
        sortSubmissions(
          currentSubmissions.map((submission) =>
            submission.id === submissionId ? result.submission! : submission
          )
        )
      );
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send submission to Make.");
    } finally {
      setActionId("");
    }
  }

  function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadSubmissions(password);
  }

  function onTabChange(nextTab: DashboardTab) {
    setActiveTab(nextTab);

    if (nextTab !== "paid") {
      setPaidTierFilter("all");
    }
  }

  useEffect(() => {
    const savedPassword = sessionStorage.getItem(adminPasswordStorageKey);
    if (savedPassword) {
      setPassword(savedPassword);
      void loadSubmissions(savedPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-linen px-4 py-10 text-ink">
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-md place-items-center">
          <form className="w-full rounded-lg bg-white p-6 shadow-soft" onSubmit={onLogin}>
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-white">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin</h1>
                <p className="text-sm text-ink/60">Review ClassMate Connect submissions.</p>
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Admin password</span>
              <input
                className="rounded-lg border border-ink/15 px-4 py-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <button
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              Unlock dashboard
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linen px-4 py-6 text-ink sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl gap-6">
        <header className="flex flex-col justify-between gap-4 rounded-lg bg-white p-5 shadow-soft sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Submissions</h1>
              <p className="text-sm text-ink/60">Review student posts before the next workflow step.</p>
            </div>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/15 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-ink/5 disabled:opacity-60"
            disabled={isLoading}
            onClick={() => loadSubmissions()}
            type="button"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {dashboardTabs.map((tab) => (
            <button
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id ? "bg-brand text-white" : "bg-white text-ink hover:bg-ink/5"
              }`}
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              type="button"
            >
              {tab.label}
              <span className="ml-2 opacity-70">{counts[tab.id] ?? 0}</span>
            </button>
          ))}
        </div>

        {activeTab === "paid" && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                paidTierFilter === "all" ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"
              }`}
              onClick={() => setPaidTierFilter("all")}
              type="button"
            >
              All paid
              <span className="ml-2 opacity-70">{paidTierCounts.all ?? 0}</span>
            </button>
            {postingTiers.map((tier) => (
              <button
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  paidTierFilter === tier.id
                    ? "bg-ink text-white"
                    : "bg-white text-ink hover:bg-ink/5"
                }`}
                key={tier.id}
                onClick={() => setPaidTierFilter(tier.id)}
                type="button"
              >
                {tier.label}
                <span className="ml-2 opacity-70">{paidTierCounts[tier.id] ?? 0}</span>
              </button>
            ))}
          </div>
        )}

        {failedSubmissions.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">
                    {failedSubmissions.length} post{failedSubmissions.length === 1 ? "" : "s"} failed in Make.
                  </p>
                  <p className="mt-1 text-sm leading-6">
                    {failedSubmissions[0].instagram_handle}:{" "}
                    {failedSubmissions[0].error_message ?? "No error message was provided."}
                  </p>
                </div>
              </div>
              {activeTab !== "failed" && (
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
                  onClick={() => onTabChange("failed")}
                  type="button"
                >
                  View Failed
                </button>
              )}
            </div>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {isLoading ? (
          <div className="grid min-h-80 place-items-center rounded-lg bg-white shadow-soft">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : visibleSubmissions.length === 0 ? (
          <div className="grid min-h-80 place-items-center rounded-lg bg-white p-8 text-center shadow-soft">
            <div>
              <h2 className="text-lg font-bold">No submissions here yet</h2>
              <p className="mt-1 text-sm text-ink/60">
                {submissions.length === 0
                  ? "New form entries will show up in this dashboard."
                  : `No ${activeTab === "paid" ? "paid" : formatStatus(activeTab).toLowerCase()} submissions right now.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleSubmissions.map((submission) => (
              <article className="rounded-lg bg-white p-4 shadow-soft sm:p-5" key={submission.id}>
                <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                  <div className="grid gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                          {submission.school}
                        </p>
                        <h2 className="mt-1 text-xl font-bold">{submission.full_name}</h2>
                        <p className="text-sm text-ink/60">
                          {submission.email} · {submission.instagram_handle}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Payment: {formatStatus(submission.payment_status)}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[submission.post_status]
                          }`}
                        >
                          {formatStatus(submission.post_status)}
                        </span>
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap rounded-lg bg-linen p-4 text-sm leading-6 text-ink/80">
                      {submission.caption}
                    </p>

                    {submission.post_status === "failed" && (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
                        <span className="font-semibold">Make error:</span>{" "}
                        {submission.error_message ?? "No error message was provided."}
                      </p>
                    )}

                    {submission.post_status === "posted" && submission.instagram_post_id && (
                      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                        <span className="font-semibold">Instagram post ID:</span>{" "}
                        {submission.instagram_post_id}
                      </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border border-ink/10 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                          Submitted
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {formatSubmittedAt(submission.created_at)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-ink/10 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                          Tier
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {getTierDisplay(submission).label}
                        </p>
                        <p className="mt-1 text-xs font-medium text-ink/55">
                          {getTierDisplay(submission).price} · {getTierDisplay(submission).speed}
                        </p>
                      </div>
                      <div className="rounded-lg border border-ink/10 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                          Photos
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {submission.image_urls.length} uploaded
                        </p>
                      </div>
                      <div className="rounded-lg border border-ink/10 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                          Submission ID
                        </p>
                        <p className="mt-1 truncate font-mono text-xs font-semibold text-ink/70">
                          {submission.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={
                          actionId === submission.id ||
                          submission.post_status === "sent_to_make" ||
                          submission.post_status === "posted"
                        }
                        onClick={() => sendToMake(submission.id)}
                        type="button"
                      >
                        {actionId === submission.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {getApproveLabel(submission)}
                      </button>
                      <button
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={actionId === submission.id || submission.post_status === "rejected"}
                        onClick={() => updateStatus(submission.id, "rejected")}
                        type="button"
                      >
                        {actionId === submission.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Reject
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
                    {submission.image_urls.map((imageUrl, index) => (
                      <a
                        className="block aspect-square overflow-hidden rounded-lg bg-ink/5 ring-1 ring-ink/10"
                        href={imageUrl}
                        key={imageUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <img
                          alt={`${submission.full_name} upload ${index + 1}`}
                          className="h-full w-full object-cover"
                          src={imageUrl}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
