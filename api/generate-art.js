export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ message: "Prompt is required and must be a non-empty string." });
  }

  const apiKey = process.env.HYPERBOLIC_API_KEY;
  const baseUrl = process.env.HYPERBOLIC_BASE_URL || "https://api.hyperbolic.xyz/v1";

  if (!apiKey) {
    console.error("❌ Missing HYPERBOLIC_API_KEY in environment.");
    return res.status(500).json({ message: "Server configuration error: API key missing." });
  }

  const payload = {
    model_name: "FLUX.1-dev",
    prompt: prompt.trim(),
    width: 1024,
    height: 1024,
    steps: 25,
    cfg_scale: 7,
    sampler: "Euler a",
  };

  console.log("📤 [HYPERBOLIC] Payload:", payload);

  try {
    const response = await fetch(`${baseUrl}/image/generation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log("📥 [HYPERBOLIC] Response:", result);

    if (!response.ok) {
      return res.status(response.status).json({
        message: result.message || result.error || result.detail || "Image generation failed",
      });
    }

    const image_url =
      Array.isArray(result.images)
        ? result.images[0]?.image || result.images[0]?.url
        : result.image || result.url || result.result?.image_url || result.output?.image_url;

    if (!image_url) {
      return res.status(500).json({ message: "No image returned from API." });
    }

    return res.status(200).json({ image_url });

  } catch (error) {
    console.error("💥 Server Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
