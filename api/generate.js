export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed" });
  }

  const { prompt, input_image } = req.body;
  const apiKey = process.env.BFL_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key is missing in server config" });
  }

  if (!prompt || typeof prompt !== "string" || !input_image || typeof input_image !== "string") {
    return res.status(400).json({ error: "Invalid or missing 'prompt' or 'input_image'" });
  }

  try {
    const submission = await fetch("https://api.bfl.ai/v1/flux-kontext-pro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-key": apiKey,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        image: input_image,
      }),
    });

    if (!submission.ok) {
      const errorText = await submission.text();
      console.error("❌ Error from FLUX.1:", errorText);
      return res.status(submission.status).json({ error: errorText });
    }

    const job = await submission.json();
    const pollingUrl = job?.polling_url;

    if (!pollingUrl) {
      return res.status(502).json({ error: "No polling URL received from BFL API", raw: job });
    }

    const pollForResult = async (url, attempts = 10, delay = 2000) => {
      for (let i = 0; i < attempts; i++) {
        const response = await fetch(url, {
          headers: { "x-key": apiKey },
        });

        if (!response.ok) {
          throw new Error(`Polling failed: ${await response.text()}`);
        }

        const data = await response.json();

        const imageUrl =
          data?.result?.sample ||
          data?.data?.image_url ||
          data?.image ||
          (typeof data === "string" && data.startsWith("data:image/") ? data : null);

        if (imageUrl) {
          return imageUrl;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      throw new Error("Timeout: No image generated after polling.");
    };

    const imageUrl = await pollForResult(pollingUrl);

    return res.status(200).json({
      result: {
        sample: imageUrl, // atau ganti jadi `image: imageUrl` jika ingin berbeda
      },
    });
  } catch (err) {
    console.error("💥 Unexpected error:", err);
    return res.status(500).json({
      error: err.message || "Unknown error occurred during image generation",
    });
  }
}
