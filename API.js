import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ===== Deposit (Paystack) =====
app.post("/api/deposit", async (req, res) => {
  try {
    const { email, amount } = req.body;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack expects kobo
        callback_url: "https://yourapp.vercel.app/success",
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Deposit failed", details: err.message });
  }
});

// ===== Withdraw (Paystack Transfer) =====
app.post("/api/withdraw", async (req, res) => {
  try {
    const { account_number, bank_code, amount } = req.body;

    // Step 1: Resolve bank account
    const verify = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
      }
    );
    const verifyData = await verify.json();
    if (!verifyData.status) return res.status(400).json({ error: "Invalid account details" });

    // Step 2: Initiate transfer recipient
    const recipient = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name: verifyData.data.account_name,
        account_number,
        bank_code,
        currency: "NGN",
      }),
    });
    const recipientData = await recipient.json();

    // Step 3: Transfer funds
    const transfer = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100,
        recipient: recipientData.data.recipient_code,
        reason: "GTRADE Withdrawal",
      }),
    });

    const transferData = await transfer.json();
    res.json(transferData);
  } catch (err) {
    res.status(500).json({ error: "Withdraw failed", details: err.message });
  }
});

// ===== Referral Reward =====
app.post("/api/referral", async (req, res) => {
  try {
    const { referrerId, newUserId } = req.body;

    // Store reward in Firebase (Firestore/Realtime DB)
    // For now simulate:
    res.json({
      status: "success",
      message: `Referral recorded. ${referrerId} gets $0.15 for referring ${newUserId}.`,
    });
  } catch (err) {
    res.status(500).json({ error: "Referral failed", details: err.message });
  }
});

// ===== Sports API (Auto-fetch 2-odds matches) =====
app.get("/api/sports", async (req, res) => {
  try {
    const response = await fetch("https://v3.football.api-sports.io/odds?bookmaker=8", {
      headers: { "x-apisports-key": process.env.58011b6234de21af0448062c8589915e },
    });

    const data = await response.json();

    // Filter only 2-odds games
    const filtered = data.response
      .map(match => {
        const odds = match.bookmakers?.[0]?.bets?.[0]?.values || [];
        if (odds.length === 2) {
          return {
            fixture: match.fixture,
            teams: match.teams,
            odds,
          };
        }
        return null;
      })
      .filter(Boolean);

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: "Sports fetch failed", details: err.message });
  }
});

// ===== Default =====
app.get("/", (req, res) => {
  res.send("✅ GTRADE API is running!");
});

export default app;
