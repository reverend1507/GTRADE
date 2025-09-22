export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { account_number, bank_code, amount } = req.body;

    // Step 1: Resolve bank account
    const resolve = await fetch("https://api.paystack.co/bank/resolve", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.sk_live_d80b6a76b47dad1a6a2636634d098a26130a5484}`
      },
      qs: {
        account_number,
        bank_code
      }
    });

    const resolved = await resolve.json();
    if (!resolved.status) {
      return res.status(400).json({ error: "Invalid bank account" });
    }

    // Step 2: Create transfer recipient
    const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.sk_live_d80b6a76b47dad1a6a2636634d098a26130a5484}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name: resolved.data.account_name,
        account_number,
        bank_code,
        currency: "NGN"
      }),
    });

    const recipient = await recipientResponse.json();

    // Step 3: Make transfer
    const transferResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.sk_live_d80b6a76b47dad1a6a2636634d098a26130a5484}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100,
        recipient: recipient.data.recipient_code,
        reason: "Withdrawal from GTRADE"
      }),
    });

    const transfer = await transferResponse.json();
    return res.status(200).json(transfer);
  } catch (error) {
    console.error("Withdraw error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
