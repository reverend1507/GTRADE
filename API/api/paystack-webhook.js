import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.sk_live_d80b6a76b47dad1a6a2636634d098a26130a5484;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  try {
    const event = req.body;

    if (event.event === "charge.success") {
      const email = event.data.customer.email;
      const amount = event.data.amount / 100; // convert back from kobo

      // TODO: Update user balance in Firebase here
      // Example: call Firebase Admin SDK to add balance
      console.log(`Credit ${email} with $${amount}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
