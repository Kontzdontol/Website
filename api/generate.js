export default async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed" });
  }

  // Ambil variabel dari request body
  const { prompt, input_image } = req.body;
  const apiKey = process.env.BFL_API_KEY;

  // Cek apakah API Key tersedia di environment
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  // Validasi input dari user
  if (!prompt || !input_image) {
    return res.status(400).json({ error: "Missing 'prompt' or 'input_image'" });
  }

  try {
    // Kirim permintaan ke BFL AI
    const response = await fetch("https://api.bfl.ai/v1/flux-kontext-pro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-key": apiKey, // Sesuai dokumentasi BFL, mereka pakai header x-key
      },
      body: JSON.stringify({
        prompt: prompt,
        image: input_image,
      }),
    });

    // Jika gagal, tampilkan pesan error dari BFL API
    if (!response.ok) {
      const errorText = await response.text();
      console.error("BFL API Error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    // Jika berhasil, kirimkan hasilnya ke frontend
    const result = await response.json();
    return res.status(200).json(result);

  } catch (error) {
    // Tangani error server secara umum
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
