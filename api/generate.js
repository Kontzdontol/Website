export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed" });
  }

  const { prompt, input_image } = req.body;
  const apiKey = process.env.BFL_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  if (!prompt || !input_image) {
    return res.status(400).json({ error: "Missing 'prompt' or 'input_image'" });
  }

  try {
    const response = await fetch("https://api.bfl.ai/v1/flux-kontext-pro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        image: input_image,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ BFL API Error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();
    console.log("🔥 BFL API Raw Response:", JSON.stringify(result, null, 2));

    // Coba beberapa kemungkinan letak gambar
    const imageUrl =
      result?.result?.sample ||
      result?.data?.image_url ||
      result?.image ||
      (typeof result === "string" && result.startsWith("data:image/") ? result : null);

    if (!imageUrl) {
      return res.status(502).json({
        error: "No image URL returned by BFL API",
        raw: result, // Tambahkan untuk debugging client-side
      });
    }

    return res.status(200).json({
      result: {
        sample: imageUrl,
      },
    });

  } catch (error) {
    console.error("💥 Server error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
