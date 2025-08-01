export default async function handler(req, res) {
  // Izinkan hanya metode POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed" });
  }

  // Ambil variabel dari request body
  const { prompt, input_image } = req.body;
  const apiKey = process.env.BFL_API_KEY;

  // Cek API key
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  // Validasi input
  if (!prompt || !input_image) {
    return res.status(400).json({ error: "Missing 'prompt' or 'input_image'" });
  }

  try {
    // Kirim request ke BFL
    const response = await fetch("https://api.bfl.ai/v1/flux-kontext-pro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-key": apiKey,
      },
      body: JSON.stringify({
        prompt: prompt,
        image: input_image,
      }),
    });

    // Tangani response gagal
    if (!response.ok) {
      const errorText = await response.text();
      console.error("BFL API Error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    // Ambil hasil response
    const result = await response.json();
    console.log("🔥 BFL API Response:", result);

    // Ambil URL gambar dari respons
    const imageUrl =
      result?.result?.sample || // jika sudah sesuai
      result?.data?.image_url || // jika format lain
      result?.image || // fallback lain
      null;

    // Validasi hasil
    if (!imageUrl) {
      return res.status(502).json({ error: "No image URL returned by BFL API" });
    }

    // Standarkan respons ke frontend
    return res.status(200).json({
      result: {
        sample: imageUrl,
      },
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
