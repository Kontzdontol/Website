document.addEventListener("DOMContentLoaded", () => {
  const openTextModalBtn = document.getElementById("openTextModal");
  const openImageModalBtn = document.getElementById("openImageModal");
  const textModal = document.getElementById("textModal");
  const imageModal = document.getElementById("imageModal");
  const textGenerateBtn = textModal.querySelector("button");
  const imageGenerateBtn = imageModal.querySelector("button");

  // Open modals
  openTextModalBtn.onclick = () => (textModal.style.display = "block");
  openImageModalBtn.onclick = () => (imageModal.style.display = "block");

  // Close modals
  document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => {
      textModal.style.display = "none";
      imageModal.style.display = "none";
    };
  });

  window.onclick = e => {
    if (e.target === textModal) textModal.style.display = "none";
    if (e.target === imageModal) imageModal.style.display = "none";
  };

  // === TEXT → IMAGE ===
  textGenerateBtn.onclick = async () => {
    const prompt = document.getElementById("prompt").value.trim();
    const status = document.getElementById("status");
    const img = document.getElementById("memeImage");

    if (!prompt) {
      status.innerText = "⚠️ Prompt tidak boleh kosong!";
      return;
    }

    status.innerText = "⏳ Mengirim permintaan ke AI...";
    img.style.display = "none";
    img.src = "";
    textGenerateBtn.disabled = true;
    textGenerateBtn.innerText = "Loading...";

    try {
      const response = await fetch("http://localhost:3000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify({ prompt, aspect_ratio: "1:1" })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status} - Gagal kirim permintaan`);

      const data = await response.json();
      const pollingUrl = data.polling_url;
      if (!pollingUrl) throw new Error("❌ Polling URL tidak ditemukan!");

      status.innerText = "🔄 Menunggu hasil dari AI...";

      let result = null;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const poll = await fetch(`http://localhost:3000/poll?url=${encodeURIComponent(pollingUrl)}`);
        const pollData = await poll.json();
        console.log("Polling status:", pollData.status);

        if (pollData.status === "Ready") {
          result = pollData;
          break;
        }
        if (["Error", "Failed"].includes(pollData.status)) {
          throw new Error(pollData.error || "Gagal memproses permintaan.");
        }
      }

      if (!result?.result?.sample) throw new Error("⏰ Timeout: Gambar tidak tersedia.");

      img.src = result.result.sample;
      img.style.display = "block";
      status.innerText = "✅ Gambar berhasil dibuat!";
    } catch (err) {
      console.error("❌ Error:", err);
      status.innerText = "⚠️ " + (err.message || "Terjadi kesalahan.");
    } finally {
      textGenerateBtn.disabled = false;
      textGenerateBtn.innerText = "Generate Meme";
    }
  };

  // === IMAGE → IMAGE EDIT ===
  imageGenerateBtn.onclick = async () => {
    const fileInput = document.getElementById("imageInput");
    const status = document.getElementById("statusImage");
    const img = document.getElementById("uploadedMemeImage");

    const prompt = window.prompt("Apa yang ingin kamu ubah dari gambar ini?");
    if (!fileInput.files[0]) return alert("Pilih gambar terlebih dahulu.");
    if (!prompt || prompt.trim() === "") return alert("Prompt tidak boleh kosong.");

    const fileSizeMB = fileInput.files[0].size / 1024 / 1024;
    if (fileSizeMB > 20) return alert("❌ Ukuran gambar melebihi 20MB.");

    status.innerText = "📤 Mengunggah gambar...";
    imageGenerateBtn.disabled = true;
    imageGenerateBtn.innerText = "Uploading...";

    const reader = new FileReader();
    reader.onload = async function () {
  const base64Image = reader.result.split(",")[1];
  console.log("📷 Base64 image length:", base64Image.length); // <--- Tambahkan di sini

      try {
        const response = await fetch("http://localhost:3000/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({ prompt, input_image: base64Image })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Server response error:", errorText);
          throw new Error("Gagal mengirim permintaan edit gambar.");
        }

        const data = await response.json();
        const pollingUrl = data.polling_url;
        if (!pollingUrl) throw new Error("Polling URL tidak ditemukan.");

        status.innerText = "⏳ Menunggu hasil dari AI...";
        let result = null;

        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const poll = await fetch(`http://localhost:3000/poll?url=${encodeURIComponent(pollingUrl)}`);
          const pollData = await poll.json();
          console.log("Polling status:", pollData.status);

          if (pollData.status === "Ready") {
            result = pollData;
            break;
          }
          if (["Error", "Failed"].includes(pollData.status)) {
            throw new Error(pollData.error || "Gagal memproses gambar.");
          }
        }

        if (!result?.result?.sample) throw new Error("⏰ Timeout: Gambar tidak tersedia.");

        img.src = result.result.sample;
        img.style.display = "block";
        status.innerText = "✅ Gambar berhasil diubah!";
      } catch (err) {
        console.error("❌ Error saat edit gambar:", err);
        status.innerText = "⚠️ " + (err.message || "Terjadi kesalahan.");
      } finally {
        imageGenerateBtn.disabled = false;
        imageGenerateBtn.innerText = "Upload & Generate";
      }
    };

    reader.readAsDataURL(fileInput.files[0]);
  };
});
