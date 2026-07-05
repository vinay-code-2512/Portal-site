const WORKER_URL = process.env.NEXT_PUBLIC_RAZORPAY_WORKER_URL || "https://robot-genie-payments.wild-sun-0ca5.workers.dev";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

async function parseJsonSafe(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Payment service returned ${res.status} ${res.statusText}. ` +
      `Expected JSON but got: ${text.slice(0, 300)}`
    );
  }
}

export async function initiatePayment(
  courseId: string,
  courseName: string,
  customerName: string,
  totalAmount: number,
  discount: number
): Promise<PaymentResult> {
  try {
    const orderRes = await fetch(`${WORKER_URL}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, courseName, amount: totalAmount * 100 }),
    });

    const orderData = await parseJsonSafe(orderRes);

    if (!orderRes.ok) {
      return { success: false, error: (orderData.error as string) || "Failed to create order" };
    }

    const { order_id, currency, key_id } = orderData as { order_id: string; currency: string; key_id: string };
    const amountPaise = totalAmount * 100;

    await loadScript("https://checkout.razorpay.com/v1/checkout.js");

    return new Promise((resolve) => {
      const options = {
        key: key_id,
        amount: amountPaise,
        currency,
        name: "Robot Genie",
        description: courseName,
        order_id,
        prefill: { name: customerName },
        theme: { color: "#00f0ff" },
        modal: {
          ondismiss: () => resolve({ success: false, error: "Payment cancelled" }),
        },
        handler: async (response: Record<string, string>) => {
          try {
            const verifyRes = await fetch(`${WORKER_URL}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                name: customerName,
                courseName,
                courseId,
                amount: amountPaise,
                discount,
              }),
            });

            const verifyData = await parseJsonSafe(verifyRes);

            if (verifyRes.ok) {
              resolve({ success: true, paymentId: response.razorpay_payment_id });
            } else {
              resolve({ success: false, error: (verifyData.error as string) || "Verification failed" });
            }
          } catch {
            resolve({ success: false, error: "Verification request failed" });
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Something went wrong";
    return { success: false, error: msg };
  }
}
