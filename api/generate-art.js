// /api/generate-art.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { prompt } = req.body;

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    const response = await fetch("https://api.deepai.org/api/pixel-art-generator", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "api-key": process.env.DEEP_AI_KEY
      },
      body: new URLSearchParams({ text: prompt })
    });

    const result = await response.json();

    if (!response.ok) {
      // Jika error dari DeepAI (misal kuota habis, api key salah, dsb)
      console.error("DeepAI API error:", result);
      return res.status(response.status).json({
        message: result?.error || "Error from DeepAI",
        detail: result
      });
    }

    if (!result.output_url) {
      return res.status(500).json({ message: "No output_url received from DeepAI", result });
    }

    return res.status(200).json({ image_url: result.output_url });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ message: "Art generation failed.", error: error.message });
  }
}
