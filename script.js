document.addEventListener("DOMContentLoaded", () => {
  // Elemen untuk fitur editor.png
  const imageInput = document.getElementById("imageInput");
  const promptInput = document.getElementById("imagePrompt");
  const generateBtn = document.getElementById("generateImageBtn");
  const resultImage = document.getElementById("uploadedMemeImage");
  const statusImage = document.getElementById("statusImage");

  // Elemen untuk fitur art.png
  const artPrompt = document.getElementById("artPrompt");
  const generateArtBtn = document.getElementById("generateArtBtn");
  const resultArtImage = document.getElementById("generatedArtImage");
  const statusArt = document.getElementById("statusArt");

  // === FITUR 1: Image Editor ===
  generateBtn?.addEventListener("click", async () => {
    const file = imageInput.files[0];
    const prompt = promptInput.value.trim();

    if (!file) {
      statusImage.textContent = "❌ Silakan unggah gambar terlebih dahulu.";
      return;
    }

    if (!prompt) {
      statusImage.textContent = "❌ Prompt tidak boleh kosong.";
      return;
    }

    statusImage.textContent = "⏳ Mengirim permintaan...";
    resultImage.style.display = "none";

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            input_image: base64,
          }),
        });

        const data = await response.json();
        console.log("📥 [EDITOR] Response:", data);

        if (!response.ok) {
          statusImage.textContent = `❌ Gagal: ${data.message || "Permintaan gagal"}`;
          return;
        }

        let imageUrl = null;

        // Deteksi hasil output BFL.AI
        if (data.result?.sample) {
          imageUrl = data.result.sample;
        } else if (data.result?.image) {
          imageUrl = data.result.image;
        } else if (typeof data.result === "string" && data.result.startsWith("data:image")) {
          imageUrl = data.result;
        } else if (data.image_url) {
          imageUrl = data.image_url;
        }

        if (imageUrl) {
          resultImage.src = imageUrl;
          resultImage.style.display = "block";
          statusImage.textContent = "✅ Gambar berhasil dibuat!";
        } else {
          statusImage.textContent = "❌ Gagal: Respons tidak berisi gambar.";
          console.warn("⚠️ Tidak ditemukan URL gambar dalam response:", data);
        }
      } catch (error) {
        console.error("💥 [EDITOR] Error:", error);
        statusImage.textContent = "❌ Terjadi kesalahan saat menghubungi server.";
      }
    };

    reader.readAsDataURL(file);
  });

  // === FITUR 2: Pixel Art Generator ===
  generateArtBtn?.addEventListener("click", async () => {
    const prompt = artPrompt.value.trim();

    if (!prompt) {
      statusArt.textContent = "❌ Prompt tidak boleh kosong.";
      return;
    }

    statusArt.textContent = "⏳ Menghasilkan gambar...";
    resultArtImage.style.display = "none";

    try {
      const response = await fetch("/api/generate-art", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          width: 512,
          height: 512,
        }),
      });

      const data = await response.json();
      console.log("📥 [ART] Response:", data);

      if (!response.ok) {
        statusArt.textContent = `❌ Gagal: ${data.message || "Permintaan gagal"}`;
        return;
      }

      const imageUrl = data.output || data.image_url || data.result?.image;

      if (imageUrl) {
        resultArtImage.src = imageUrl;
        resultArtImage.style.display = "block";
        statusArt.textContent = "✅ Gambar berhasil dibuat!";
      } else {
        statusArt.textContent = "❌ Gagal: Tidak ada gambar dikembalikan.";
        console.warn("⚠️ Tidak ditemukan URL gambar:", data);
      }
    } catch (error) {
      console.error("💥 [ART] Error:", error);
      statusArt.textContent = "❌ Terjadi kesalahan saat mengirim permintaan.";
    }
  });
});
