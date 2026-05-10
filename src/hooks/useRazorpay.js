// src/hooks/useRazorpay.js
// ══════════════════════════════════════════════════════════════════════════════
// Razorpay Payment Hook
//
// Usage:
//   const { initiatePayment, isLoading, error } = useRazorpay();
//   await initiatePayment({ packId: 'pack_300' });
//
// Flow:
//   1. POST /credits/razorpay/create-order  → orderId
//   2. Load Razorpay SDK script (if not loaded)
//   3. Open checkout modal with orderId
//   4. User pays → handler receives { razorpay_payment_id, razorpay_order_id, razorpay_signature }
//   5. POST /credits/razorpay/verify        → signature verified → credits granted
//   6. Invalidate React Query cache         → sidebar balance updates live
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// TypeScript-safe access to Razorpay SDK loaded dynamically
/** @type {any} */
const _window = window;

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

// ── Load Razorpay script dynamically ─────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (_window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script tag already injected (but not yet loaded)
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
        new Error(
          "Failed to load Razorpay checkout script. Check your internet connection.",
        ),
      );
    document.head.appendChild(script);
  });
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useRazorpay() {
  const qc = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * initiatePayment
   * @param {Object} options
   * @param {string} options.packId          — e.g. 'pack_300'
   * @param {string} [options.userName]       prefill customer name
   * @param {string} [options.userEmail]      prefill email
   * @param {string} [options.userPhone]      prefill phone (format: +91XXXXXXXXXX)
   * @param {Function} [options.onSuccess]    called with credits count after success
   * @param {Function} [options.onFailure]    called with error message on failure
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
        // ── Step 1: Load Razorpay SDK ──────────────────────────────────────
        await loadRazorpayScript();

        // ── Step 2: Create order on backend ───────────────────────────────
        const orderRes = await api.post("/credits/razorpay/create-order", {
          packId,
        });
        const { orderId, amount, currency, razorpayKeyId, credits } =
          orderRes?.data ?? orderRes;

        if (!orderId || !razorpayKeyId || !amount || !currency) {
          throw new Error("Failed to create payment order. Please try again.");
        }

        // ── Step 3: Open Razorpay checkout modal ──────────────────────────
        await new Promise((resolve, reject) => {
          const options = {
            key: razorpayKeyId,
            amount, // in paise — already set by backend
            currency,
            name: "ARIA",
            description: `${credits} ARIA Credits`,
            image: "/logo.png", // your app logo — update path as needed
            order_id: orderId,

            // Prefill customer details if available
            prefill: {
              name: userName,
              email: userEmail,
              contact: userPhone,
            },

            // ARIA brand colors
            theme: {
              color: "#D97706", // amber-600 — matches your sidebar-primary
            },

            // Show all domestic payment methods (not just QR)
            config: {
              display: {
                blocks: {
                  banks: {
                    name: "Pay via",
                    instruments: [
                      { method: "upi" },
                      { method: "card" },
                      { method: "netbanking" },
                      { method: "wallet" },
                    ],
                  },
                },
                sequence: ["block.banks"],
                preferences: { show_default_blocks: true },
              },
            },

            // Modal options
            modal: {
              confirm_close: true, // show "are you sure?" when user clicks X
              ondismiss: () => {
                // User closed the modal without paying — not an error
                setIsLoading(false);
                resolve({ dismissed: true });
              },
            },

            // Notes passed to Razorpay — appear in dashboard
            notes: {
              packId,
              product: "ARIA Credits",
            },

            // ── Step 4: Payment success handler ───────────────────────────
            handler: async (response) => {
              const {
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
              } = response;

              try {
                // ── Step 5: Verify payment on backend (CRITICAL) ───────────
                const verifyRes = await api.post("/credits/razorpay/verify", {
                  razorpay_payment_id,
                  razorpay_order_id,
                  razorpay_signature,
                  packId,
                });

                const { credits: grantedCredits } =
                  verifyRes?.data ?? verifyRes;

                // ── Step 6: Refresh wallet balance ─────────────────────────
                await qc.invalidateQueries({ queryKey: ["credits-wallet"] });
                await qc.invalidateQueries({ queryKey: ["credits-history"] });

                onSuccess?.(grantedCredits);
                resolve({ success: true, credits: grantedCredits });
              } catch (verifyErr) {
                const msg =
                  verifyErr?.response?.data?.message ||
                  "Payment was received but verification failed. Contact support if credits are not added within 5 minutes.";
                setError(msg);
                onFailure?.(msg);
                reject(verifyErr);
              }
            },
          };

          const rzp = new _window.Razorpay(options);

          // Handle payment failure (user's card declined, etc.)
          rzp.on("payment.failed", (response) => {
            const msg =
              response?.error?.description ||
              "Payment failed. Please try a different payment method.";
            setError(msg);
            onFailure?.(msg);
            reject(new Error(msg));
          });

          rzp.open();
        });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again.";
        setError(msg);
        onFailure?.(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [qc],
  );

  return {
    initiatePayment,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
