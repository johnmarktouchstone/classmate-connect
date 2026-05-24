export const postingTiers = [
  {
    id: "instant",
    label: "Instant",
    speedLabel: "Post instantly",
    priceCents: 2500,
    badge: null,
  },
  {
    id: "two_hours",
    label: "2 hours",
    speedLabel: "Post within 2 hours",
    priceCents: 1700,
    badge: "Most popular",
  },
  {
    id: "twenty_four_hours",
    label: "24 hours",
    speedLabel: "Post within 24 hours",
    priceCents: 1200,
    badge: "Best deal",
  },
  {
    id: "five_days",
    label: "5 days",
    speedLabel: "Post within 5 days",
    priceCents: 500,
    badge: null,
  },
] as const;

export type PostingTierId = (typeof postingTiers)[number]["id"];

export const defaultPostingTierId: PostingTierId = "instant";

export function getPostingTier(id: string | null | undefined) {
  return postingTiers.find((tier) => tier.id === id);
}

export function getDefaultPostingTier() {
  return postingTiers.find((tier) => tier.id === defaultPostingTierId) ?? postingTiers[0];
}

export function formatTierPrice(cents: number | null | undefined) {
  if (!cents) return "Legacy price";

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}
