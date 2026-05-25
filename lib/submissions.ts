export const paymentStatuses = ["unpaid", "paid", "refunded"] as const;
export const postStatuses = [
  "unpaid",
  "needs_review",
  "rejected",
  "sent_to_make",
  "posted",
  "failed"
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];
export type PostStatus = (typeof postStatuses)[number];

export type Submission = {
  id: string;
  school: string;
  full_name: string;
  email: string;
  instagram_handle: string;
  caption: string;
  image_urls: string[];
  stripe_session_id: string | null;
  payment_status: PaymentStatus;
  post_status: PostStatus;
  make_sent_at: string | null;
  posted_at: string | null;
  error_message: string | null;
  instagram_post_id: string | null;
  posting_tier: string | null;
  posting_speed: string | null;
  price_cents: number | null;
  created_at: string;
  updated_at: string;
};

export function isPostStatus(value: string): value is PostStatus {
  return postStatuses.includes(value as PostStatus);
}

export function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
