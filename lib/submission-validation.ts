import { getSchool } from "@/lib/schools";
import { getPostingTier } from "@/lib/posting-tiers";

export const maxCaptionLength = 2200;
export const maxImages = 10;

export function normalizeInstagramHandle(handle: string) {
  const trimmed = handle.trim();
  return trimmed && !trimmed.startsWith("@") ? `@${trimmed}` : trimmed;
}

export function validateSubmissionInput(input: {
  school: string;
  fullName: string;
  email: string;
  instagramHandle: string;
  caption: string;
  imageUrls: string[];
  consent: boolean;
  postingTier: string;
}) {
  if (!getSchool(input.school)) return "Unknown school page.";
  if (!getPostingTier(input.postingTier)) return "Unknown posting speed.";
  if (!input.fullName.trim()) return "Full name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return "A valid email is required.";
  }
  if (!input.instagramHandle.trim() || input.instagramHandle.trim() === "@") {
    return "Instagram handle is required.";
  }
  if (!input.caption.trim()) return "Caption is required.";
  if (input.caption.length > maxCaptionLength) return "Caption must be 2,200 characters or fewer.";
  if (input.imageUrls.length < 1) return "Upload at least one image.";
  if (input.imageUrls.length > maxImages) return "Upload no more than 10 images.";
  if (!input.imageUrls.every((url) => url.startsWith("https://"))) {
    return "Image uploads must use public HTTPS URLs.";
  }
  if (!input.consent) return "Photo permission consent is required.";
  return null;
}
