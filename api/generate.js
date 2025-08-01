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
    const submission = await fetch("https://api.bfl.ai/v1/flux-kontext-pro", {
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

    if (!submission.ok) {
      const errorText = await submission.text();
      console.error("❌ BFL Submission Error:", errorText);
      return res.status(submission.status).json({ error: errorText });
    }

    const job = await submission.json();
    const pollingUrl = job?.polling_url;

    if (!pollingUrl) {
      return res.status(502).json({ error: "No polling URL returned by BFL API", raw: job });
    }

    // Polling helper
    const pollForResult = async (url, attempts = 10, delay = 2000) => {
      for (let i = 0; i < attempts; i++) {
        const pollRes = await fetch(url, {
          headers: { "x-key": apiKey },
        });

        if (!pollRes.ok) {
          throw new Error(`Polling failed: ${await pollRes.text()}`);
        }

        const pollData = await pollRes.json();
        const imageUrl =
          pollData?.result?.sample ||
          pollData?.data?.image_url ||
          pollData?.image ||
          (typeof pollData === "string" && pollData.startsWith("data:image/") ? pollData : null);

        if (imageUrl) return imageUrl;

        // Jika belum ada hasil, tunggu lalu coba lagi
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      throw new Error("Timeout: No image generated after polling.");
    };

    // Tunggu hasilnya
    const imageUrl = await pollForResult(pollingUrl);

    return res.status(200).json({
      result: { sample: imageUrl },
    });

  } catch (error) {
    console.error("💥 Server error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
