export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed" });
  }

  const { prompt, input_image } = req.body;
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  if (!prompt || !input_image) {
    return res.status(400).json({ error: "Missing prompt or input image" });
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
      console.error("BFL API error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();
    res.status(200).json(result);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
