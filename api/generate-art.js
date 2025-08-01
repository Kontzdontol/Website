export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const {
    prompt,
    model_name = "SDXL1.0-base",
    width = 1024,
    height = 1024,
    backend = "",
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

  // Ganti model Flux.1 dengan yang valid
  let finalModel = model_name;
  if (model_name.toLowerCase() === "flux.1") {
    finalModel = "FLUX.1-dev";
  }

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
      negative_prompt,
      steps,
      cfg_scale,
      sampler,
    };

    if (style_preset?.trim()) {
      payload.style_preset = style_preset;
    }

    if (backend && backend !== "auto") {
      payload.backend = backend;
    }

    console.log("📤 [HYPERBOLIC] Payload:", payload);

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

    // Tangani error spesifik: model tidak didukung
    if (response.status === 400 && result.message?.includes("is not supported")) {
      return res.status(400).json({
        message: `Model '${finalModel}' is not currently supported. Please try another available model.`,
        available_models: result.message.match(/\[(.*?)\]/)?.[1]?.split(",").map(s => s.trim().replace(/['"]/g, ''))
      });
    }

    if (!response.ok) {
      console.error("❌ API Error:", result);
      return res.status(response.status).json({
        message: result.message || result.error || result.detail || "Image generation failed",
      });
    }

    // Ambil URL gambar dari berbagai kemungkinan struktur
    const image_url =
      Array.isArray(result.images)
        ? result.images[0]?.image || result.images[0]?.url
        : result.image || result.url || result.result?.image_url || result.output?.image_url;

    if (!image_url) {
      console.error("❌ No image URL in API response:", result);
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
