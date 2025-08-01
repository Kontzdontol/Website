// /api/generate-art.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const { prompt } = req.body;

    // Validasi input
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ message: "Prompt is required and must be a non-empty string." });
    }

    // Panggil API DeepAI
    const response = await fetch("https://api.deepai.org/api/pixel-art-generator", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "api-key": process.env.DEEP_AI_KEY,
      },
      body: new URLSearchParams({ text: prompt }),
    });

    const result = await response.json();

    // Cek apakah respon valid
    if (!response.ok || !result.output_url) {
      console.error("API DeepAI error:", result);
      return res.status(502).json({ message: "Failed to generate art from DeepAI." });
    }

    return res.status(200).json({
      success: true,
      url: result.output_url,
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ message: "Internal server error while generating art." });
  }
}
