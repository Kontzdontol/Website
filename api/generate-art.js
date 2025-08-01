// pages/api/generate-art.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { prompt, model_name = "SD1.5", width = 512, height = 512 } = req.body;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ message: "Prompt is required and must be a non-empty string." });
  }

  const apiKey = process.env.HYPERBOLIC_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing HYPERBOLIC_API_KEY in environment.");
    return res.status(500).json({ message: "Server configuration error: API key missing." });
  }

  try {
    const response = await fetch("https://api.hyperbolic.xyz/v1/image/generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model_name,
        prompt,
        width,
        height,
        backend: "auto"
      })
    });

    const data = await response.json();
    console.log("🔎 Hyperbolic response:", JSON.stringify(data, null, 2)); // Untuk debug

    if (!response.ok) {
      console.error("🔴 Hyperbolic API error:", data);
      return res.status(response.status).json({
        message: data.error || data.detail || "Generation failed from Hyperbolic API."
      });
    }

    let image_url = null;

    if (Array.isArray(data.images) && data.images[0]?.image) {
      image_url = data.images[0].image;

      // Jika base64 image
      if (image_url.startsWith("data:image")) {
        return res.status(200).json({ image_url });
      }

      // Jika http/https URL
      if (/^https?:\/\//.test(image_url)) {
        return res.status(200).json({ image_url });
      }

      // Jika tidak cocok format
      console.error("⚠️ Invalid image format:", image_url);
      return res.status(500).json({ message: "Invalid image format from Hyperbolic API." });
    }

    return res.status(500).json({ message: "No image returned from API." });

  } catch (err) {
    console.error("💥 Internal server error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
}
