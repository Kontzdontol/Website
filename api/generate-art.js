// pages/api/generate-art.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const {
    prompt,
    model_name = "SDXL1.0-base",
    width = 512,
    height = 512,
    backend = "auto",
    negative_prompt = "",
    steps = 25,
    cfg_scale = 7,
    sampler = "Euler a",
    style_preset = ""
  } = req.body;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ message: "Prompt is required and must be a non-empty string." });
  }

  const apiKey = process.env.HYPERBOLIC_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing HYPERBOLIC_API_KEY in environment.");
    return res.status(500).json({ message: "Server configuration error: API key missing." });
  }

  try {
    const payload = {
      model_name,
      prompt,
      height,
      width,
      backend,
      negative_prompt,
      steps,
      cfg_scale,
      sampler,
    };

    // Optional style_preset
    if (style_preset && style_preset !== "") {
      payload.style_preset = style_preset;
    }

    const response = await fetch("https://api.hyperbolic.xyz/v1/image/generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🔴 Hyperbolic API error:", data);
      return res.status(response.status).json({
        message: data.error || data.detail || "Generation failed from Hyperbolic API.",
      });
    }

    const image_url = Array.isArray(data.images) ? data.images[0]?.image : null;

    if (!image_url) {
      console.error("❌ No image returned in API response:", data);
      return res.status(500).json({ message: "No image URL returned from API." });
    }

    return res.status(200).json({ image_url });

  } catch (err) {
    console.error("💥 Internal server error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
}
