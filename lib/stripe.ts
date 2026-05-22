import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

export function getStripe() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-04-22.dahlia"
  });
}

export function getPostPriceCents() {
  const cents = Number(process.env.POST_PRICE_CENTS ?? "299");

  if (!Number.isInteger(cents) || cents < 50) {
    throw new Error("POST_PRICE_CENTS must be an integer of at least 50.");
  }

  return cents;
}
