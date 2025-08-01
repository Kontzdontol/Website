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

  // Validasi prompt
  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ message: "Prompt is required and must be a non-empty string." });
  }

  // Model fallback mapping
  const modelMap = {
    "Flux.1": "FLUX.1-dev",
    "SDXL": "SDXL1.0-base",
    "default": "SD1.5"
  };

  // Gunakan model yang benar atau fallback ke default
  const finalModel = modelMap[model_name] || model_name;

  const apiKey = process.env.HYPERBOLIC_API_KEY;
  const baseUrl = process.env.HYPERBOLIC_BASE_URL || "https://api.hyperbolic.xyz/v1";

  if (!apiKey) {
    console.error("❌ Missing HYPERBOLIC_API_KEY in environment.");
    return res.status(500).json({ message: "Server configuration error: API key missing." });
  }

  try {
    const payload = {
      model_name: finalModel,
      prompt,
      width,
      height,
      backend,
      negative_prompt,
      steps,
      cfg_scale,
      sampler
    };

    if (style_preset && style_preset.trim() !== "") {
      payload.style_preset = style_preset;
    }

    console.log("📤 [HYPERBOLIC] Request Payload:", payload);

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

    // Jika error 403 karena model tidak tersedia, fallback ke model default
    if (result.code === 40301 || result.message?.includes("not available")) {
      console.warn("⚠️ Model tidak tersedia, fallback ke model default:", modelMap["default"]);
      payload.model_name = modelMap["default"];

      const fallbackResponse = await fetch(`${baseUrl}/image/generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const fallbackResult = await fallbackResponse.json();
      console.log("📥 [Fallback Response]:", fallbackResult);

      if (!fallbackResponse.ok) {
        return res.status(fallbackResponse.status).json({
          message: fallbackResult.error || fallbackResult.detail || "Fallback image generation failed",
        });
      }

      const fallbackImageUrl = Array.isArray(fallbackResult.images)
        ? fallbackResult.images[0]?.image || fallbackResult.images[0]?.url
        : fallbackResult.image || fallbackResult.url || fallbackResult.result?.image_url;

      if (!fallbackImageUrl) {
        return res.status(500).json({ message: "No image returned from fallback model." });
      }

      return res.status(200).json({ image_url: fallbackImageUrl });
    }

    if (!response.ok) {
      console.error("❌ Hyperbolic returned:", result);
      return res.status(response.status).json({
        message: result.error || result.detail || "Image generation failed",
      });
    }

    const image_url = Array.isArray(result.images)
      ? result.images[0]?.image || result.images[0]?.url
      : result.image || result.url || result.result?.image_url;

    if (!image_url) {
      console.error("❌ No image URL in response:", result);
      return res.status(500).json({ message: "No image returned from API." });
    }

    return res.status(200).json({ image_url });

  } catch (error) {
    console.error("💥 Internal server error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
