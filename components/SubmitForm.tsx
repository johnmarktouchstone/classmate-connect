"use client";

import {
  ChangeEvent,
  FormEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
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
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  maxCaptionLength,
  maxImages,
  normalizeInstagramHandle,
} from "@/lib/submission-validation";

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

const defaultCrop: CropSettings = {
  x: 0,
  y: 0,
  zoom: 1,
};

const instagramImageWidth = 1080;
const instagramImageHeight = 1350;
const minZoom = 1;
const maxZoom = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getDistance(
  firstPoint: { x: number; y: number },
  secondPoint: { x: number; y: number },
) {
  return Math.hypot(firstPoint.x - secondPoint.x, firstPoint.y - secondPoint.y);
}

function formatPreviewHandle(handle: string) {
  const trimmedHandle = handle.trim();

  if (!trimmedHandle) {
    return "@yourhandle";
  }

  return trimmedHandle.startsWith("@") ? trimmedHandle : `@${trimmedHandle}`;
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
  const previewHandle = formatPreviewHandle(instagramHandle);
  const selectedPreview = previews[selectedPhotoIndex] ?? previews[0];
  const captionText = caption.trim() || "Your caption will appear here.";
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

          <p className="break-words text-sm leading-6 text-ink">
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
  disabled,
  onReset,
  onUpdateCrop,
  preview,
  selectedPhotoIndex,
}: {
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

      <label className="hidden gap-2 md:grid">
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
      <label className="hidden gap-2 md:grid">
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
      <label className="hidden gap-2 md:grid">
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
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
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
    setSelectedPhotoIndex(0);
    event.target.value = "";
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index].url);
    const nextPreviews = previews.filter((_, currentIndex) => currentIndex !== index);
    setPreviews(nextPreviews);
    setSelectedPhotoIndex((currentIndex) =>
      Math.min(currentIndex, Math.max(0, nextPreviews.length - 1)),
    );
    setSubmissionId("");
  }

  function updateCrop(index: number, crop: Partial<CropSettings>) {
    setPreviews((currentPreviews) =>
      currentPreviews.map((preview, currentIndex) =>
        currentIndex === index
          ? { ...preview, crop: { ...preview.crop, ...crop } }
          : preview,
      ),
    );
    setSubmissionId("");
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
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {previews.map((preview, index) => (
                    <div
                      className={`relative aspect-[4/5] overflow-hidden rounded-lg bg-ink/5 ring-offset-2 transition ${
                        selectedPhotoIndex === index
                          ? "ring-2 ring-brand"
                          : "ring-1 ring-ink/10"
                      }`}
                      key={preview.url}
                    >
                      <button
                        className="h-full w-full"
                        disabled={isSubmitting}
                        onClick={() => setSelectedPhotoIndex(index)}
                        type="button"
                      >
                        <CroppedPreviewImage
                          alt={`Upload preview ${index + 1}`}
                          preview={preview}
                        />
                      </button>
                      <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-ink shadow">
                        {index + 1}
                      </span>
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

                {selectedPreview && (
                  <CropAdjuster
                    disabled={isSubmitting}
                    onReset={() => updateCrop(selectedPhotoIndex, defaultCrop)}
                    onUpdateCrop={(crop) => updateCrop(selectedPhotoIndex, crop)}
                    preview={selectedPreview}
                    selectedPhotoIndex={selectedPhotoIndex}
                  />
                )}
              </div>
            )}
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
        className="hidden lg:block"
        instagramHandle={instagramHandle}
        onSelectPhoto={setSelectedPhotoIndex}
        previews={previews}
        selectedPhotoIndex={selectedPhotoIndex}
        school={school}
      />
    </div>
  );
}
