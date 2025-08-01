// pages/api/generate-art.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }
  const { prompt, model_name = "SD1.5", width = 512, height = 512 } = req.body;
  if (!prompt) return res.status(400).json({ message: "Prompt is required" });

  const apiKey = process.env.HYPERBOLIC_API_KEY;
  console.log("DEBUG: Using Hyperbolic API Key exists?", apiKey ? "✅ yes" : "❌ no");

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
    if (!response.ok) {
      console.error("Error from Hyperbolic:", data);
      return res.status(response.status).json({ message: data.error || data.detail || "Generation failed" });
    }
    const image_url = Array.isArray(data.images) && data.images[0]?.image;
    res.status(200).json({ image_url });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
}
