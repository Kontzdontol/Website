export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { prompt, width, height } = req.body;

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
    width: typeof width === "number" ? width : 1024,
    height: typeof height === "number" ? height : 1024,
    steps: 30,
    cfg_scale: 7,
    sampler: "Euler a",
    enable_refiner: false,
  };

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
    console.log("📦 API Response:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("⚠️ API Error Response:", result);
      return res.status(response.status).json({
        message: result?.message || result?.error || "Failed to generate image",
      });
    }

    const base64Image = result?.images?.[0]?.image;

    if (!base64Image || typeof base64Image !== "string") {
      console.error("❌ No valid image found in response:", result);
      return res.status(500).json({ message: "No image returned from API." });
    }

    const image_url = `data:image/png;base64,${base64Image}`;
    console.log("✅ Generated Base64 image URL");
    return res.status(200).json({ image_url });

  } catch (error) {
    console.error("💥 Unexpected Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
