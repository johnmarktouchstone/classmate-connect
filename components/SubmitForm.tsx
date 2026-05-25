"use client";

import {
  ChangeEvent,
  FormEvent,
  PointerEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import type { School } from "@/lib/schools";
import { formatCaptionForInstagram, formatInstagramHandle } from "@/lib/caption";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  maxCaptionLength,
  maxImages,
  normalizeInstagramHandle,
} from "@/lib/submission-validation";
import {
  defaultPostingTierId,
  formatTierPrice,
  getPostingTier,
  postingTiers,
  type PostingTierId,
} from "@/lib/posting-tiers";
import { applyPromoCode, normalizePromoCode } from "@/lib/promo-codes";

type Preview = {
  crop: CropSettings;
  file: File;
  url: string;
};

type CropSettings = {
  x: number;
  y: number;
  zoom: number;
};

type FormStep = "about" | "photos" | "review" | "tier";

const defaultCrop: CropSettings = {
  x: 0,
  y: 0,
  zoom: 1,
};

const instagramImageWidth = 1080;
const instagramImageHeight = 1350;
const minZoom = 1;
const maxZoom = 2;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getDistance(
  firstPoint: { x: number; y: number },
  secondPoint: { x: number; y: number },
) {
  return Math.hypot(firstPoint.x - secondPoint.x, firstPoint.y - secondPoint.y);
}

function CroppedPreviewImage({
  alt,
  className = "",
  preview,
}: {
  alt: string;
  className?: string;
  preview: Preview;
}) {
  const [croppedUrl, setCroppedUrl] = useState("");
  const croppedUrlRef = useRef("");

  useEffect(() => {
    let isCancelled = false;

    async function renderCrop() {
      const croppedFile = await createInstagramCroppedFile(preview, 0);
      const nextUrl = URL.createObjectURL(croppedFile);

      if (isCancelled) {
        URL.revokeObjectURL(nextUrl);
        return;
      }

      setCroppedUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        croppedUrlRef.current = nextUrl;
        return nextUrl;
      });
    }

    void renderCrop();

    return () => {
      isCancelled = true;
    };
  }, [preview.crop.x, preview.crop.y, preview.crop.zoom, preview.url]);

  useEffect(() => {
    return () => {
      if (croppedUrlRef.current) {
        URL.revokeObjectURL(croppedUrlRef.current);
      }
    };
  }, []);

  if (!croppedUrl) {
    return <div className={`h-full w-full bg-ink/5 ${className}`} />;
  }

  return (
    <img
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      src={croppedUrl}
    />
  );
}

function InstagramPreview({
  caption,
  className = "",
  instagramHandle,
  onSelectPhoto,
  previews,
  selectedPhotoIndex,
  school,
}: {
  caption: string;
  className?: string;
  instagramHandle: string;
  onSelectPhoto: (index: number) => void;
  previews: Preview[];
  selectedPhotoIndex: number;
  school: School;
}) {
  const selectedPreview = previews[selectedPhotoIndex] ?? previews[0];
  const captionText = formatCaptionForInstagram(caption, instagramHandle);
  const hasMultiplePhotos = previews.length > 1;

  function showPreviousPhoto() {
    if (!hasMultiplePhotos) return;
    onSelectPhoto((selectedPhotoIndex - 1 + previews.length) % previews.length);
  }

  function showNextPhoto() {
    if (!hasMultiplePhotos) return;
    onSelectPhoto((selectedPhotoIndex + 1) % previews.length);
  }

  return (
    <aside
      className={`rounded-lg bg-white p-5 shadow-soft lg:sticky lg:top-6 lg:self-start ${className}`}
    >
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

        <div className="relative grid aspect-[4/5] place-items-center overflow-hidden bg-linen">
          {selectedPreview ? (
            <CroppedPreviewImage
              alt={`Uploaded photo preview ${selectedPhotoIndex + 1}`}
              preview={selectedPreview}
            />
          ) : (
            <p className="max-w-48 px-4 text-center text-sm font-medium leading-6 text-ink/55">
              Your photo preview will appear here.
            </p>
          )}

          {hasMultiplePhotos && (
            <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-white">
              {selectedPhotoIndex + 1} / {previews.length}
            </span>
          )}
          {hasMultiplePhotos && (
            <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
              <button
                aria-label="Show previous preview photo"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
                onClick={showPreviousPhoto}
                type="button"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Show next preview photo"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
                onClick={showNextPhoto}
                type="button"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-3 px-4 py-4">
          <div className="flex items-center gap-3 text-ink/70">
            <Heart className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Send className="h-5 w-5" />
          </div>

          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-ink">
            <span className={caption.trim() ? "" : "text-ink/50"}>
              {captionText}
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}

function CropAdjuster({
  action,
  disabled,
  onReset,
  onUpdateCrop,
  preview,
  selectedPhotoIndex,
}: {
  action?: ReactNode;
  disabled: boolean;
  onReset: () => void;
  onUpdateCrop: (crop: Partial<CropSettings>) => void;
  preview: Preview;
  selectedPhotoIndex: number;
}) {
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<{
    distance: number;
    pointerCount: number;
    startCrop: CropSettings;
    x: number;
    y: number;
  } | null>(null);

  function startGesture(nextPointers: Map<number, { x: number; y: number }>) {
    const points = Array.from(nextPointers.values());

    gestureRef.current = {
      distance: points.length >= 2 ? getDistance(points[0], points[1]) : 0,
      pointerCount: points.length,
      startCrop: preview.crop,
      x: points[0]?.x ?? 0,
      y: points[0]?.y ?? 0,
    };
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const nextPointers = new Map(pointersRef.current);
    nextPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    pointersRef.current = nextPointers;
    startGesture(nextPointers);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (disabled || !gestureRef.current || !pointersRef.current.has(event.pointerId)) {
      return;
    }

    const nextPointers = new Map(pointersRef.current);
    nextPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    pointersRef.current = nextPointers;

    const points = Array.from(nextPointers.values());
    const rect = event.currentTarget.getBoundingClientRect();
    const gesture = gestureRef.current;

    if (points.length >= 2 && gesture.distance > 0) {
      const nextDistance = getDistance(points[0], points[1]);
      onUpdateCrop({
        zoom: clamp(
          gesture.startCrop.zoom * (nextDistance / gesture.distance),
          minZoom,
          maxZoom,
        ),
      });
      return;
    }

    const deltaX = points[0].x - gesture.x;
    const deltaY = points[0].y - gesture.y;

    onUpdateCrop({
      x: clamp(gesture.startCrop.x - (deltaX / rect.width) * 200, -100, 100),
      y: clamp(gesture.startCrop.y - (deltaY / rect.height) * 200, -100, 100),
    });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const nextPointers = new Map(pointersRef.current);
    nextPointers.delete(event.pointerId);
    pointersRef.current = nextPointers;

    if (nextPointers.size > 0) {
      startGesture(nextPointers);
    } else {
      gestureRef.current = null;
    }
  }

  return (
    <div className="grid gap-4 rounded-lg border border-ink/10 bg-linen p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            Adjust photo {selectedPhotoIndex + 1}
          </p>
          <p className="text-xs text-ink/55">
            Drag the image or pinch to zoom.
          </p>
        </div>
        <button
          className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5"
          disabled={disabled}
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
      </div>

      {action}

      <div className="mx-auto w-full max-w-56 overflow-hidden rounded-lg bg-white shadow-sm">
        <div
          className="relative aspect-[4/5] touch-none select-none overflow-hidden bg-ink/5"
          onPointerCancel={onPointerUp}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <CroppedPreviewImage
            alt={`4:5 crop preview for upload ${selectedPhotoIndex + 1}`}
            preview={preview}
          />
        </div>
      </div>

      <label className="grid gap-2">
        <span className="text-xs font-semibold text-ink/70">Zoom</span>
        <input
          disabled={disabled}
          max={maxZoom}
          min={minZoom}
          onChange={(event) =>
            onUpdateCrop({
              zoom: Number(event.target.value),
            })
          }
          step="0.01"
          type="range"
          value={preview.crop.zoom}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-xs font-semibold text-ink/70">
          Move left / right
        </span>
        <input
          disabled={disabled}
          max="100"
          min="-100"
          onChange={(event) =>
            onUpdateCrop({
              x: Number(event.target.value),
            })
          }
          type="range"
          value={preview.crop.x}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-xs font-semibold text-ink/70">Move up / down</span>
        <input
          disabled={disabled}
          max="100"
          min="-100"
          onChange={(event) =>
            onUpdateCrop({
              y: Number(event.target.value),
            })
          }
          type="range"
          value={preview.crop.y}
        />
      </label>
    </div>
  );
}

function CropModal({
  disabled,
  onClose,
  onNextPhoto,
  onReset,
  onUpdateCrop,
  preview,
  selectedPhotoIndex,
  totalPhotos,
}: {
  disabled: boolean;
  onClose: () => void;
  onNextPhoto: () => void;
  onReset: () => void;
  onUpdateCrop: (crop: Partial<CropSettings>) => void;
  preview: Preview;
  selectedPhotoIndex: number;
  totalPhotos: number;
}) {
  const hasNextPhoto = selectedPhotoIndex < totalPhotos - 1;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-end bg-ink/55 p-0 sm:place-items-center sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close crop editor"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        type="button"
      />
      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:max-w-md sm:rounded-2xl">
        <CropAdjuster
          action={
            <div className={`grid gap-3 ${totalPhotos > 1 ? "grid-cols-2" : ""}`}>
              <button
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                disabled={disabled}
                onClick={onClose}
                type="button"
              >
                Done
              </button>
              {totalPhotos > 1 && (
                <button
                  className="flex items-center justify-center gap-2 rounded-lg border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/5 disabled:cursor-not-allowed disabled:border-ink/15 disabled:text-ink/35"
                  disabled={disabled || !hasNextPhoto}
                  onClick={onNextPhoto}
                  type="button"
                >
                  Next photo
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          }
          disabled={disabled}
          onReset={onReset}
          onUpdateCrop={onUpdateCrop}
          preview={preview}
          selectedPhotoIndex={selectedPhotoIndex}
        />
      </div>
    </div>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not prepare image for upload."));
    image.src = src;
  });
}

async function createInstagramCroppedFile(preview: Preview, index: number) {
  const image = await loadImage(preview.url);
  const canvas = document.createElement("canvas");
  canvas.width = instagramImageWidth;
  canvas.height = instagramImageHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare image for upload.");
  }

  const baseScale = Math.max(
    instagramImageWidth / image.naturalWidth,
    instagramImageHeight / image.naturalHeight,
  );
  const scale = baseScale * preview.crop.zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const maxOffsetX = Math.max(0, (drawWidth - instagramImageWidth) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - instagramImageHeight) / 2);
  const offsetX = (preview.crop.x / 100) * maxOffsetX;
  const offsetY = (preview.crop.y / 100) * maxOffsetY;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, instagramImageWidth, instagramImageHeight);
  context.drawImage(
    image,
    (instagramImageWidth - drawWidth) / 2 - offsetX,
    (instagramImageHeight - drawHeight) / 2 - offsetY,
    drawWidth,
    drawHeight,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (nextBlob) resolve(nextBlob);
        else reject(new Error("Could not prepare image for upload."));
      },
      "image/jpeg",
      0.92,
    );
  });

  return new File([blob], `classmate-instagram-${index + 1}.jpg`, {
    type: "image/jpeg",
  });
}

export function SubmitForm({ school }: { school: School }) {
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
  const [submittedImageUrls, setSubmittedImageUrls] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<FormStep>("about");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<PostingTierId>(defaultPostingTierId);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  const previewsRef = useRef<Preview[]>([]);

  const emailIsValid = emailPattern.test(email.trim());
  const aboutFieldsComplete =
    fullName.trim() &&
    email.trim() &&
    instagramHandle.trim() &&
    caption.trim();
  const aboutComplete = aboutFieldsComplete && emailIsValid;
  const photosComplete = previews.length > 0;
  const stepIndex =
    currentStep === "about"
      ? 1
      : currentStep === "photos"
        ? 2
        : currentStep === "review"
          ? 3
          : 4;
  const progressWidth = `${(stepIndex / 4) * 100}%`;
  const selectedTier = getPostingTier(selectedTierId) ?? postingTiers[0];
  const appliedPromo = appliedPromoCode
    ? applyPromoCode(selectedTier.priceCents, appliedPromoCode)
    : null;
  const finalPriceCents = appliedPromo?.finalPriceCents ?? selectedTier.priceCents;

  const canSubmit = useMemo(
    () =>
      fullName.trim() &&
      emailIsValid &&
      instagramHandle.trim() &&
      caption.trim() &&
      previews.length > 0 &&
      consent &&
      !isSubmitting,
    [
      caption,
      consent,
      email,
      emailIsValid,
      fullName,
      instagramHandle,
      isSubmitting,
      previews.length,
    ],
  );

  function goToPhotos() {
    setError("");

    if (!aboutFieldsComplete) {
      setError("Please complete your name, email, Instagram handle, and bio.");
      return;
    }

    if (!emailIsValid) {
      setError("Invalid email.");
      return;
    }

    setCurrentStep("photos");
  }

  function goToReview() {
    setError("");

    if (!photosComplete) {
      setError("Please add at least one photo.");
      return;
    }

    setSelectedPhotoIndex(0);
    setCurrentStep("review");
  }

  async function saveSubmissionDraft() {
    const imageUrls = submittedImageUrls.length > 0 ? submittedImageUrls : await uploadImages();
    setSubmittedImageUrls(imageUrls);
    setStatusMessage("Saving your post details...");

    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submission_id: submissionId || undefined,
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
    return result.submission_id;
  }

  async function goToTier() {
    setError("");

    if (!canSubmit) {
      setError("Please confirm photo permission before choosing a posting speed.");
      return;
    }

    setIsSubmitting(true);

    try {
      await saveSubmissionDraft();
      setStatusMessage("");
      setCurrentStep("tier");
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : "Unable to save submission.");
      setStatusMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function applyEnteredPromoCode() {
    const normalizedCode = normalizePromoCode(promoCodeInput);
    setPromoError("");
    setPromoMessage("");

    if (!normalizedCode) {
      setAppliedPromoCode("");
      setPromoError("Enter a promo code first.");
      return;
    }

    const promo = applyPromoCode(selectedTier.priceCents, normalizedCode);

    if (!promo) {
      setAppliedPromoCode("");
      setPromoError("Promo code is invalid.");
      return;
    }

    setAppliedPromoCode(promo.code);
    setPromoMessage(`${promo.code} applied: ${promo.description}.`);
  }

  function removePromoCode() {
    setAppliedPromoCode("");
    setPromoCodeInput("");
    setPromoMessage("");
    setPromoError("");
  }

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

  function resetSavedSubmission() {
    setSubmissionId("");
    setSubmittedImageUrls([]);
  }

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    resetSavedSubmission();

    const files = Array.from(event.target.files ?? []);
    const nextFiles = files.slice(0, maxImages - previews.length);

    if (files.some((file) => !file.type.startsWith("image/"))) {
      setError("Only image files are allowed.");
      event.target.value = "";
      return;
    }

    if (nextFiles.length === 0) {
      event.target.value = "";
      return;
    }

    setPreviews((currentPreviews) => [
      ...currentPreviews,
      ...nextFiles.map((file) => ({
        crop: defaultCrop,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
    setSelectedPhotoIndex(previews.length);
    setIsCropModalOpen(true);
    event.target.value = "";
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index].url);
    const nextPreviews = previews.filter((_, currentIndex) => currentIndex !== index);
    setPreviews(nextPreviews);
    setSelectedPhotoIndex((currentIndex) =>
      Math.min(currentIndex, Math.max(0, nextPreviews.length - 1)),
    );
    if (nextPreviews.length === 0) {
      setIsCropModalOpen(false);
    }
    resetSavedSubmission();
  }

  function updateCrop(index: number, crop: Partial<CropSettings>) {
    setPreviews((currentPreviews) =>
      currentPreviews.map((preview, currentIndex) =>
        currentIndex === index
          ? { ...preview, crop: { ...preview.crop, ...crop } }
          : preview,
      ),
    );
    resetSavedSubmission();
  }

  async function uploadImages() {
    const supabase = createBrowserSupabaseClient();
    const imageUrls: string[] = [];

    for (const [index, preview] of previews.entries()) {
      setStatusMessage(`Cropping photo ${index + 1} of ${previews.length}...`);

      const croppedFile = await createInstagramCroppedFile(preview, index);
      const path = `${school.slug}/${crypto.randomUUID()}.jpg`;

      setStatusMessage(`Uploading photo ${index + 1} of ${previews.length}...`);

      const { error: uploadError } = await supabase.storage
        .from("classmate-submissions")
        .upload(path, croppedFile, {
          cacheControl: "31536000",
          contentType: croppedFile.type,
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

  const selectedPreview = previews[selectedPhotoIndex];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!canSubmit) {
      setError(
        "Please complete every required field and add at least one image.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrls = submittedImageUrls.length > 0 ? submittedImageUrls : await uploadImages();
      setSubmittedImageUrls(imageUrls);
      setStatusMessage("Saving posting speed...");

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId || undefined,
          school: school.slug,
          full_name: fullName,
          email,
          instagram_handle: normalizeInstagramHandle(instagramHandle),
          caption,
          image_urls: imageUrls,
          posting_tier: selectedTierId,
          promo_code: appliedPromoCode,
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
        className="overflow-hidden rounded-lg bg-white shadow-soft"
        onSubmit={onSubmit}
      >
        <input name="school" type="hidden" value={school.slug} />

        <div className="border-b border-ink/10 px-5 py-5 sm:px-8">
          <div className="mb-4 flex items-center justify-between gap-4 text-sm text-ink/60">
            <span className="font-semibold text-brand">
              Step {stepIndex} of 4
            </span>
            <span>{school.instagramUsername}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: progressWidth }}
            />
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-8">
          {currentStep === "about" && (
            <section className="grid gap-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-ink">
                  Tell Us About Yourself
                </h2>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink">
                  Full name *
                </span>
                <input
                  className="rounded-lg border border-brand/45 px-4 py-3 text-base outline-none transition placeholder:text-ink/35 focus:border-brand focus:ring-4 focus:ring-brand/10"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    resetSavedSubmission();
                  }}
                  placeholder="Your full name"
                  required
                  value={fullName}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink">
                  Instagram handle *
                </span>
                <input
                  className="rounded-lg border border-brand/45 px-4 py-3 text-base outline-none transition placeholder:text-ink/35 focus:border-brand focus:ring-4 focus:ring-brand/10"
                  disabled={isSubmitting}
                  onBlur={() =>
                    setInstagramHandle(normalizeInstagramHandle(instagramHandle))
                  }
                  onChange={(event) => {
                    setInstagramHandle(event.target.value);
                    resetSavedSubmission();
                  }}
                  placeholder="@username"
                  required
                  value={instagramHandle}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink">Email *</span>
                <input
                  className="rounded-lg border border-brand/45 px-4 py-3 text-base outline-none transition placeholder:text-ink/35 focus:border-brand focus:ring-4 focus:ring-brand/10"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    resetSavedSubmission();
                  }}
                  placeholder="email@example.com"
                  required
                  type="email"
                  value={email}
                />
              </label>

              <label className="grid gap-2">
                <span className="flex items-center justify-between gap-3 text-sm font-semibold text-ink">
                  Bio *
                  <span className="text-ink/50">
                    {caption.length}/{maxCaptionLength}
                  </span>
                </span>
                <textarea
                  className="min-h-36 resize-y rounded-lg border border-brand/45 px-4 py-3 text-base outline-none transition placeholder:text-ink/35 focus:border-brand focus:ring-4 focus:ring-brand/10"
                  disabled={isSubmitting}
                  maxLength={maxCaptionLength}
                  onChange={(event) => {
                    setCaption(event.target.value);
                    resetSavedSubmission();
                  }}
                  placeholder="Share anything you'd like potential friends to know about you..."
                  required
                  value={caption}
                />
                <span className="text-sm leading-6 text-ink/55">
                  This will be featured in your post to help classmates get to
                  know you.
                </span>
              </label>

              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!aboutFieldsComplete || isSubmitting}
                onClick={goToPhotos}
                type="button"
              >
                Next: Photos
                <ArrowRight className="h-5 w-5" />
              </button>
            </section>
          )}

          {currentStep === "photos" && (
            <section className="grid gap-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-ink">
                  Upload Photos
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Upload 1-10 photos. Crop each one for Instagram.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-ink">
                  {previews.length}/{maxImages} photos
                </span>
                <span className="text-ink/55">
                  {previews.length > 0 ? "Ready for review" : "Need 1 photo"}
                </span>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-brand/40 bg-brand/5 px-4 py-10 text-center transition hover:bg-brand/10">
                <Camera className="h-8 w-8 text-brand" />
                <span className="text-base font-semibold text-ink">
                  Upload Photos
                </span>
                <span className="text-sm text-ink/55">
                  Photos will be cropped to a 4:5 Instagram portrait format.
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

              {previews.length > 0 && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {previews.map((preview, index) => (
                      <div
                        className={`relative aspect-[4/5] overflow-hidden rounded-lg bg-ink/5 ring-offset-2 transition ${
                          index === 0
                            ? "ring-2 ring-emerald-500"
                            : selectedPhotoIndex === index
                              ? "ring-2 ring-brand"
                              : "ring-1 ring-ink/10"
                        }`}
                        key={preview.url}
                      >
                        <button
                          className="h-full w-full"
                          disabled={isSubmitting}
                          onClick={() => {
                            setSelectedPhotoIndex(index);
                            setIsCropModalOpen(true);
                          }}
                          type="button"
                        >
                          <CroppedPreviewImage
                            alt={`Upload preview ${index + 1}`}
                            preview={preview}
                          />
                        </button>
                        {index === 0 ? (
                          <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                            Cover
                          </span>
                        ) : (
                          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-ink shadow">
                            {index + 1}
                          </span>
                        )}
                        <button
                          aria-label="Remove photo"
                          className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-ink shadow"
                          disabled={isSubmitting}
                          onClick={(event) => {
                            event.stopPropagation();
                            removePhoto(index);
                          }}
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-sm text-ink/55">
                    Tap any photo to adjust its crop. The first photo is the cover.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-ink/15 bg-white px-5 py-3 font-semibold text-ink transition hover:bg-ink/5"
                  disabled={isSubmitting}
                  onClick={() => {
                    setError("");
                    setCurrentStep("about");
                  }}
                  type="button"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>
                <button
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!photosComplete || isSubmitting}
                  onClick={goToReview}
                  type="button"
                >
                  Review
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </section>
          )}

          {currentStep === "review" && (
            <section className="grid gap-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-ink">
                  Review
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Check your post preview and confirm everything looks right.
                </p>
              </div>

              <InstagramPreview
                caption={caption}
                className="lg:hidden"
                instagramHandle={instagramHandle}
                onSelectPhoto={setSelectedPhotoIndex}
                previews={previews}
                selectedPhotoIndex={selectedPhotoIndex}
                school={school}
              />

              <div className="grid gap-2 rounded-lg bg-linen p-4 text-sm leading-6 text-ink/70">
                <p>
                  <span className="font-semibold text-ink">Name:</span>{" "}
                  {fullName || "Not added"}
                </p>
                <p>
                  <span className="font-semibold text-ink">Instagram:</span>{" "}
                  {formatInstagramHandle(instagramHandle)}
                </p>
                <p>
                  <span className="font-semibold text-ink">Photos:</span>{" "}
                  {previews.length}
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-lg bg-linen p-4">
                <input
                  checked={consent}
                  className="mt-1 h-5 w-5 accent-brand"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    resetSavedSubmission();
                  }}
                  required
                  type="checkbox"
                />
                <span className="text-sm leading-6 text-ink/75">
                  I own these photos or have permission to submit them for
                  posting by ClassMate Connect.
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-ink/15 bg-white px-5 py-3 font-semibold text-ink transition hover:bg-ink/5"
                  disabled={isSubmitting}
                  onClick={() => {
                    setError("");
                    setCurrentStep("photos");
                  }}
                  type="button"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>
                <button
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canSubmit}
                  onClick={goToTier}
                  type="button"
                >
                  Next: Select Tier
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </section>
          )}

          {currentStep === "tier" && (
            <section className="grid gap-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-ink">
                  Choose Your Posting Speed
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Select when you'd like your post to go live.
                </p>
              </div>

              <div className="grid gap-2 rounded-lg border border-ink/10 bg-linen p-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-ink">Promo code</span>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      className="min-h-12 rounded-lg border border-ink/15 bg-white px-4 py-3 text-base uppercase outline-none transition placeholder:normal-case placeholder:text-ink/35 focus:border-brand focus:ring-4 focus:ring-brand/10"
                      disabled={isSubmitting}
                      onChange={(event) => {
                        setPromoCodeInput(event.target.value);
                        setPromoError("");
                        setPromoMessage("");
                      }}
                      placeholder="Have a promo code?"
                      value={promoCodeInput}
                    />
                    <button
                      className="min-h-12 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
                      onClick={applyEnteredPromoCode}
                      type="button"
                    >
                      Apply
                    </button>
                  </div>
                </label>
                {promoError && (
                  <p className="text-sm font-medium text-red-700">{promoError}</p>
                )}
                {promoMessage && (
                  <div className="flex flex-col gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 sm:flex-row sm:items-center sm:justify-between">
                    <span>{promoMessage}</span>
                    <button
                      className="font-semibold underline"
                      onClick={removePromoCode}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {postingTiers.map((tier) => {
                  const isSelected = selectedTierId === tier.id;
                  const tierPromo = appliedPromoCode
                    ? applyPromoCode(tier.priceCents, appliedPromoCode)
                    : null;
                  const tierPriceCents = tierPromo?.finalPriceCents ?? tier.priceCents;

                  return (
                    <button
                      className={`rounded-lg border-2 p-4 text-left transition ${
                        isSelected
                          ? "border-green-500 bg-green-50 shadow-soft"
                          : "border-ink/10 bg-white hover:border-green-300"
                      }`}
                      disabled={isSubmitting}
                      key={tier.id}
                      onClick={() => {
                        setSelectedTierId(tier.id);
                        if (appliedPromoCode) {
                          const nextPromo = applyPromoCode(tier.priceCents, appliedPromoCode);
                          setPromoMessage(
                            nextPromo
                              ? `${nextPromo.code} applied: ${nextPromo.description}.`
                              : "",
                          );
                        }
                      }}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-bold text-ink">
                              {tier.label}
                            </p>
                            {tier.badge && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                {tier.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-3xl font-bold text-ink">
                            {formatTierPrice(tierPriceCents)}
                          </p>
                          {tierPromo && (
                            <p className="mt-1 text-sm font-semibold text-green-700">
                              <span className="text-ink/45 line-through">
                                {formatTierPrice(tier.priceCents)}
                              </span>{" "}
                              {formatTierPrice(tierPromo.discountCents)} off
                            </p>
                          )}
                          <p className="mt-2 text-sm text-ink/60">
                            {tier.speedLabel}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-green-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-ink/15 bg-white px-5 py-3 font-semibold text-ink transition hover:bg-ink/5"
                  disabled={isSubmitting}
                  onClick={() => {
                    setError("");
                    setCurrentStep("review");
                  }}
                  type="button"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>
                <button
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canSubmit}
                  type="submit"
                >
                  {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
                  {finalPriceCents === 0
                    ? "Submit Free Post"
                    : `Continue to Payment (${formatTierPrice(finalPriceCents)})`}
                </button>
              </div>

              <p className="text-center text-xs leading-5 text-ink/50">
                {finalPriceCents === 0
                  ? "Your promo code covers the full price, so no Stripe checkout is needed."
                  : "You'll be redirected to secure checkout. The checkout is billed monthly through Stripe."}
              </p>
            </section>
          )}

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
        </div>
      </form>

      <InstagramPreview
        caption={caption}
        className="hidden lg:block"
        instagramHandle={instagramHandle}
        onSelectPhoto={setSelectedPhotoIndex}
        previews={previews}
        selectedPhotoIndex={selectedPhotoIndex}
        school={school}
      />

      {isCropModalOpen && selectedPreview && (
        <CropModal
          disabled={isSubmitting}
          onClose={() => setIsCropModalOpen(false)}
          onNextPhoto={() =>
            setSelectedPhotoIndex((currentIndex) =>
              Math.min(currentIndex + 1, previews.length - 1),
            )
          }
          onReset={() => updateCrop(selectedPhotoIndex, defaultCrop)}
          onUpdateCrop={(crop) => updateCrop(selectedPhotoIndex, crop)}
          preview={selectedPreview}
          selectedPhotoIndex={selectedPhotoIndex}
          totalPhotos={previews.length}
        />
      )}
    </div>
  );
}
