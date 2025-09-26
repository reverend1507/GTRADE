// api/fetch-fixtures.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const date = new Date().toISOString().split("T")[0]; // today's date

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${date}&league=39&season=2023`,
      {
        headers: {
          "x-apisports-key": "58011b6234de21af0448062c8589915e"
        }
      }
    );

    const data = await response.json();

    // Push fixtures into Firebase (for group access)
    // Example only — replace with your actual Firebase write logic
    /*
    import { getFirestore, doc, setDoc } from "firebase/firestore";
    const db = getFirestore();
    await setDoc(doc(db, "trades", date), data);
    */

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
  }
