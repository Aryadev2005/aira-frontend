// src/hooks/useRazorpay.js
// ══════════════════════════════════════════════════════════════════════════════
// Razorpay hook — handles both plan purchases and top-ups
//
// Usage (plan):
//   const { initiatePlanPurchase, isLoading, error } = useRazorpay();
//   await initiatePlanPurchase({ planId: 'plan_pro', onSuccess, onFailure });
//
// Usage (topup — future):
//   await initiatePayment({ packId: 'pack_300', onSuccess, onFailure });
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (/** @type {any} */ (window).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () =>
        reject(new Error("Razorpay script failed to load")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(
        new Error("Failed to load Razorpay. Check your internet connection."),
      );
    document.head.appendChild(script);
  });
}

// ── Core checkout opener ──────────────────────────────────────────────────────
// Used internally by both initiatePlanPurchase and initiatePayment
async function openCheckout({
  itemId,
  paymentType,
  userName,
  userEmail,
  userPhone,
  onSuccess,
  onFailure,
  qc,
}) {
  await loadRazorpayScript();

  // Step 1: Create order on backend
  const orderBody =
    paymentType === "plan" ? { planId: itemId } : { packId: itemId };
  const orderRes = await api.post("/credits/razorpay/create-order", orderBody);
  const { orderId, amount, currency, razorpayKeyId, description } =
    orderRes?.data ?? orderRes;

  if (!orderId || !razorpayKeyId) {
    throw new Error("Failed to create payment order. Please try again.");
  }

  // Step 2: Open Razorpay modal
  await new Promise((resolve, reject) => {
    const options = {
      key: razorpayKeyId,
      amount,
      currency,
      name: "ARIA",
      description: description ?? "ARIA Plan",
      image: "/logo.png",
      order_id: orderId,
      prefill: {
        name: userName,
        email: userEmail,
        contact: userPhone,
      },
      theme: { color: "#D97706" },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          resolve({ dismissed: true });
        },
      },
      notes: { itemId, paymentType, product: "ARIA" },

      // Step 3: Payment success → verify on backend
      handler: async (response) => {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
          response;
        try {
          const verifyRes = await api.post("/credits/razorpay/verify", {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            itemId,
            paymentType,
          });

          const data = verifyRes?.data ?? verifyRes;

          // Refresh wallet + profile (tier may have changed)
          await qc.invalidateQueries({ queryKey: ["credits-wallet"] });
          await qc.invalidateQueries({ queryKey: ["credits-history"] });
          await qc.invalidateQueries({ queryKey: ["profile"] });

          onSuccess?.(data);
          resolve({ success: true, data });
        } catch (verifyErr) {
          const msg =
            verifyErr?.response?.data?.message ||
            "Payment received but verification failed. Contact support if your plan is not updated.";
          onFailure?.(msg);
          reject(verifyErr);
        }
      },
    };

    const rzp = new /** @type {any} */ (window).Razorpay(options);
    rzp.on("payment.failed", (response) => {
      const msg =
        response?.error?.description ||
        "Payment failed. Try a different method.";
      onFailure?.(msg);
      resolve({ failed: true });
    });
    rzp.open();
  });
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useRazorpay() {
  const qc = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * initiatePlanPurchase — buy a subscription plan
   * @param {{ planId: string, userName?: string, userEmail?: string, userPhone?: string, onSuccess?: Function, onFailure?: Function }} options
   */
  const initiatePlanPurchase = useCallback(
    async ({
      planId,
      userName = "",
      userEmail = "",
      userPhone = "",
      onSuccess,
      onFailure,
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        await openCheckout({
          itemId: planId,
          paymentType: "plan",
          userName,
          userEmail,
          userPhone,
          onSuccess,
          onFailure,
          qc,
        });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong.";
        setError(msg);
        onFailure?.(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [qc],
  );

  /**
   * initiatePayment — buy a one-time top-up pack
   * @param {{ packId: string, userName?: string, userEmail?: string, userPhone?: string, onSuccess?: Function, onFailure?: Function }} options
   */
  const initiatePayment = useCallback(
    async ({
      packId,
      userName = "",
      userEmail = "",
      userPhone = "",
      onSuccess,
      onFailure,
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        await openCheckout({
          itemId: packId,
          paymentType: "topup",
          userName,
          userEmail,
          userPhone,
          onSuccess,
          onFailure,
          qc,
        });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong.";
        setError(msg);
        onFailure?.(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [qc],
  );

  return {
    initiatePlanPurchase,
    initiatePayment,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
