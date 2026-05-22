"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Camera,
  CheckCircle2,
  Heart,
  Loader2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import type { School } from "@/lib/schools";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  maxCaptionLength,
  maxImages,
  normalizeInstagramHandle,
} from "@/lib/submission-validation";

type Preview = {
  file: File;
  url: string;
};

function formatPreviewHandle(handle: string) {
  const trimmedHandle = handle.trim();

  if (!trimmedHandle) {
    return "@yourhandle";
  }

  return trimmedHandle.startsWith("@") ? trimmedHandle : `@${trimmedHandle}`;
}

function InstagramPreview({
  caption,
  instagramHandle,
  previews,
  school,
}: {
  caption: string;
  instagramHandle: string;
  previews: Preview[];
  school: School;
}) {
  const previewHandle = formatPreviewHandle(instagramHandle);
  const firstPreview = previews[0];
  const captionText = caption.trim() || "Your caption will appear here.";

  return (
    <aside className="rounded-lg bg-white p-5 shadow-soft lg:sticky lg:top-6 lg:self-start">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Preview
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
        <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">
            CC
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {school.instagramUsername}
            </p>
            <p className="text-xs text-ink/50">Instagram post preview</p>
          </div>
        </div>

        <div className="relative grid aspect-[4/5] place-items-center bg-linen">
          {firstPreview ? (
            <img
              alt="First uploaded photo preview"
              className="h-full w-full object-cover"
              src={firstPreview.url}
            />
          ) : (
            <p className="max-w-48 px-4 text-center text-sm font-medium leading-6 text-ink/55">
              Your photo preview will appear here.
            </p>
          )}

          {previews.length > 1 && (
            <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-white">
              1 / {previews.length}
            </span>
          )}
        </div>

        <div className="grid gap-3 px-4 py-4">
          <div className="flex items-center gap-3 text-ink/70">
            <Heart className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Send className="h-5 w-5" />
          </div>

          <p className="break-words text-sm leading-6 text-ink">
            <span className="font-semibold">{previewHandle}</span>{" "}
            <span className={caption.trim() ? "" : "text-ink/50"}>
              {captionText}
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}

export function SubmitForm({
  priceLabel,
  school,
}: {
  priceLabel: string;
  school: School;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const previewsRef = useRef<Preview[]>([]);

  const canSubmit = useMemo(
    () =>
      fullName.trim() &&
      email.trim() &&
      instagramHandle.trim() &&
      caption.trim() &&
      previews.length > 0 &&
      consent &&
      !isSubmitting,
    [
      caption,
      consent,
      email,
      fullName,
      instagramHandle,
      isSubmitting,
      previews.length,
    ],
  );

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) =>
        URL.revokeObjectURL(preview.url),
      );
    };
  }, []);

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setSubmissionId("");

    const files = Array.from(event.target.files ?? []);
    const nextFiles = [
      ...previews.map((preview) => preview.file),
      ...files,
    ].slice(0, maxImages);

    if (nextFiles.some((file) => !file.type.startsWith("image/"))) {
      setError("Only image files are allowed.");
      event.target.value = "";
      return;
    }

    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setPreviews(
      nextFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    );
    event.target.value = "";
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index].url);
    setPreviews(previews.filter((_, currentIndex) => currentIndex !== index));
    setSubmissionId("");
  }

  async function uploadImages() {
    const supabase = createBrowserSupabaseClient();
    const imageUrls: string[] = [];

    for (const [index, preview] of previews.entries()) {
      setStatusMessage(`Uploading photo ${index + 1} of ${previews.length}...`);

      const extension = preview.file.name.split(".").pop() || "jpg";
      const path = `${school.slug}/${crypto.randomUUID()}.${extension.toLowerCase()}`;

      const { error: uploadError } = await supabase.storage
        .from("classmate-submissions")
        .upload(path, preview.file, {
          cacheControl: "31536000",
          contentType: preview.file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage
        .from("classmate-submissions")
        .getPublicUrl(path);
      imageUrls.push(data.publicUrl);
    }

    return imageUrls;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmissionId("");

    if (!canSubmit) {
      setError(
        "Please complete every required field and add at least one image.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrls = await uploadImages();
      setStatusMessage("Saving submission...");

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school: school.slug,
          full_name: fullName,
          email,
          instagram_handle: normalizeInstagramHandle(instagramHandle),
          caption,
          image_urls: imageUrls,
          consent,
        }),
      });

      const result = (await response.json()) as {
        submission_id?: string;
        error?: string;
      };

      if (!response.ok || !result.submission_id) {
        throw new Error(result.error || "Unable to save submission.");
      }

      setSubmissionId(result.submission_id);
      setStatusMessage("Opening secure checkout...");

      const checkoutResponse = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: result.submission_id }),
      });
      const checkoutResult = (await checkoutResponse.json()) as {
        url?: string;
        error?: string;
      };

      if (!checkoutResponse.ok || !checkoutResult.url) {
        throw new Error(checkoutResult.error || "Unable to start checkout.");
      }

      window.location.href = checkoutResult.url;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong.",
      );
      setStatusMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form
        className="rounded-lg bg-white p-5 shadow-soft sm:p-8"
        onSubmit={onSubmit}
      >
        <div className="grid gap-5">
          <input name="school" type="hidden" value={school.slug} />

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Full name</span>
            <input
              className="rounded-lg border border-ink/15 px-4 py-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              disabled={isSubmitting}
              onChange={(event) => {
                setFullName(event.target.value);
                setSubmissionId("");
              }}
              required
              value={fullName}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Email</span>
            <input
              className="rounded-lg border border-ink/15 px-4 py-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              disabled={isSubmitting}
              onChange={(event) => {
                setEmail(event.target.value);
                setSubmissionId("");
              }}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">
              Instagram handle
            </span>
            <input
              className="rounded-lg border border-ink/15 px-4 py-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              disabled={isSubmitting}
              onBlur={() =>
                setInstagramHandle(normalizeInstagramHandle(instagramHandle))
              }
              onChange={(event) => {
                setInstagramHandle(event.target.value);
                setSubmissionId("");
              }}
              placeholder="@yourhandle"
              required
              value={instagramHandle}
            />
          </label>

          <label className="grid gap-2">
            <span className="flex items-center justify-between gap-3 text-sm font-semibold text-ink">
              Caption (don't forget your @)
              <span className="text-ink/50">
                {caption.length}/{maxCaptionLength}
              </span>
            </span>
            <textarea
              className="min-h-40 resize-y rounded-lg border border-ink/15 px-4 py-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              disabled={isSubmitting}
              maxLength={maxCaptionLength}
              onChange={(event) => {
                setCaption(event.target.value);
                setSubmissionId("");
              }}
              required
              value={caption}
            />
          </label>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">Photos</span>
              <span className="text-sm text-ink/55">
                {previews.length}/{maxImages}
              </span>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-brand/40 bg-brand/5 px-4 py-8 text-center transition hover:bg-brand/10">
              <Camera className="h-7 w-7 text-brand" />
              <span className="text-sm font-semibold text-ink">
                Add 1 to 10 images
              </span>
              <input
                accept="image/*"
                className="sr-only"
                disabled={previews.length >= maxImages || isSubmitting}
                multiple
                onChange={onFilesSelected}
                type="file"
              />
            </label>
            <p className="text-sm leading-6 text-ink/55">
              Photos will be cropped to a 4:5 Instagram portrait format.
            </p>
            {previews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map((preview, index) => (
                  <div
                    className="relative aspect-square overflow-hidden rounded-lg bg-ink/5"
                    key={preview.url}
                  >
                    <img
                      alt={`Upload preview ${index + 1}`}
                      className="h-full w-full object-cover"
                      src={preview.url}
                    />
                    <button
                      aria-label="Remove photo"
                      className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-ink shadow"
                      disabled={isSubmitting}
                      onClick={() => removePhoto(index)}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-lg bg-linen p-4">
            <input
              checked={consent}
              className="mt-1 h-5 w-5 accent-brand"
              disabled={isSubmitting}
              onChange={(event) => {
                setConsent(event.target.checked);
                setSubmissionId("");
              }}
              required
              type="checkbox"
            />
            <span className="text-sm leading-6 text-ink/75">
              I own these photos or have permission to submit them for posting
              by ClassMate Connect.
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {statusMessage && (
            <p className="flex items-start gap-2 rounded-lg bg-brand/10 px-4 py-3 text-sm font-medium text-brand">
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
              {statusMessage}
            </p>
          )}
          {submissionId && (
            <p className="flex items-start gap-2 rounded-lg bg-brand/10 px-4 py-3 text-sm font-medium text-brand">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Submission saved. Redirecting to checkout...
            </p>
          )}

          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canSubmit}
            type="submit"
          >
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            Submit & Pay ({priceLabel})
          </button>
        </div>
      </form>

      <InstagramPreview
        caption={caption}
        instagramHandle={instagramHandle}
        previews={previews}
        school={school}
      />
    </div>
  );
}
