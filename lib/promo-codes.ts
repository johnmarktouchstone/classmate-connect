export type PromoCodeResult = {
  code: string;
  description: string;
  discountCents: number;
  finalPriceCents: number;
  isFree: boolean;
};

const promoCodes = {
  FREEPOST: {
    description: "Free post",
    percentOff: 100,
  },
  WELCOME50: {
    description: "50% off",
    percentOff: 50,
  },
} as const;

export function normalizePromoCode(code: string | null | undefined) {
  return (code ?? "").trim().toUpperCase();
}

export function getPromoCode(code: string | null | undefined) {
  const normalizedCode = normalizePromoCode(code);

  if (!normalizedCode) return null;

  return promoCodes[normalizedCode as keyof typeof promoCodes] ? normalizedCode : null;
}

export function applyPromoCode(basePriceCents: number, code: string | null | undefined): PromoCodeResult | null {
  const normalizedCode = getPromoCode(code);

  if (!normalizedCode) return null;

  const promoCode = promoCodes[normalizedCode as keyof typeof promoCodes];
  const discountCents = Math.min(
    basePriceCents,
    Math.round(basePriceCents * (promoCode.percentOff / 100)),
  );
  const finalPriceCents = Math.max(0, basePriceCents - discountCents);

  return {
    code: normalizedCode,
    description: promoCode.description,
    discountCents,
    finalPriceCents,
    isFree: finalPriceCents === 0,
  };
}

export function isValidPromoCode(code: string | null | undefined) {
  return Boolean(getPromoCode(code));
}
