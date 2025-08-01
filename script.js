document.addEventListener("DOMContentLoaded", () => {
  // 🔧 DOM Elements
  const openImageModalBtn = document.getElementById("openImageModal");
  const imageModal = document.getElementById("imageModal");
  const imageGenerateBtn = document.getElementById("generateImageBtn");
  const fileInput = document.getElementById("imageInput");
  const status = document.getElementById("statusImage");
  const img = document.getElementById("uploadedMemeImage");

  const profileIcon = document.getElementById("profileIcon");
  const profilePopup = document.getElementById("profilePopup");
  const emailIcon = document.getElementById("emailIcon");
  const emailPopup = document.getElementById("emailPopup");
  const closeEmailBtn = document.querySelector(".close-email");
  const instaIcon = document.getElementById("instaIcon");
  const instaPopup = document.getElementById("instaPopup");
  const twitterIcon = document.getElementById("twitterIcon");
  const twitterPopup = document.getElementById("twitterPopup");
  const mediumIcon = document.getElementById("mediumIcon");
  const mediumPopup = document.getElementById("mediumPopup");

  const artIcon = document.getElementById("artIcon");
  const artPopup = document.getElementById("artPopup");
  const artGenerateBtn = document.getElementById("generateArtBtn");
  const artPromptInput = document.getElementById("artPrompt");
  const artImage = document.getElementById("generatedArtImage");
  const artStatus = document.getElementById("statusArt");
  const modelSelect = document.getElementById("modelSelect");

  const openArtModalBtn = document.getElementById("openArtModalBtn");
  const artModal = document.getElementById("artModal");
  const closeArtBtn = document.querySelector(".close-art");

  // 🖼️ Modal: Image Upload
  openImageModalBtn?.addEventListener("click", () => {
    imageModal.style.display = "block";
  });

  document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
      imageModal.style.display = "none";
      resetImageForm();
    });
  });

  // 🧠 Modal: Art Generator
  openArtModalBtn?.addEventListener("click", () => {
    artModal.style.display = "block";
  });

  closeArtBtn?.addEventListener("click", () => {
    artModal.style.display = "none";
  });

  // 🪟 Close modals on outside click
  window.addEventListener("click", e => {
    if (e.target === imageModal) {
      imageModal.style.display = "none";
      resetImageForm();
    }
    if (e.target === artModal) {
      artModal.style.display = "none";
    }
    closeAllPopups(e);
  });

  // 🧩 Popup toggle handlers
  profileIcon?.addEventListener("click", e => togglePopupWith(e, profilePopup, [emailPopup, instaPopup, twitterPopup, mediumPopup, artPopup]));
  emailIcon?.addEventListener("click", e => togglePopupWith(e, emailPopup, [profilePopup, instaPopup, twitterPopup, mediumPopup, artPopup]));
  instaIcon?.addEventListener("click", e => togglePopupWith(e, instaPopup, [profilePopup, emailPopup, twitterPopup, mediumPopup, artPopup]));
  twitterIcon?.addEventListener("click", e => togglePopupWith(e, twitterPopup, [profilePopup, emailPopup, instaPopup, mediumPopup, artPopup]));
  mediumIcon?.addEventListener("click", e => togglePopupWith(e, mediumPopup, [profilePopup, emailPopup, instaPopup, twitterPopup, artPopup]));
  artIcon?.addEventListener("click", e => togglePopupWith(e, artPopup, [profilePopup, emailPopup, instaPopup, twitterPopup, mediumPopup]));

  closeEmailBtn?.addEventListener("click", () => {
    emailPopup.style.display = "none";
  });

  // ✨ AI Image Editing (BFL)
  imageGenerateBtn?.addEventListener("click", async () => {
    const file = fileInput.files[0];
    const userPrompt = window.prompt("Apa yang ingin kamu ubah dari gambar ini?");
    if (!file) return alert("⚠️ Pilih gambar terlebih dahulu.");
    if (!userPrompt || userPrompt.trim() === "") return alert("⚠️ Prompt tidak boleh kosong.");
    if (file.size / 1024 / 1024 > 20) return alert("❌ Ukuran gambar melebihi 20MB.");

    const prompt = `Edit gambar input ini sesuai instruksi berikut: ${userPrompt}`;

    status.innerText = "📤 Mengunggah gambar...";
    imageGenerateBtn.disabled = true;
    imageGenerateBtn.innerText = "Processing...";

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result.split(",")[1];
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ prompt, input_image: base64Image })
        });

        if (!res.ok) throw new Error(await res.text());
        const result = await res.json();
        const imageResult = result?.result?.sample;
        if (!imageResult) throw new Error("⏰ Gambar tidak tersedia dari AI.");

        img.src = imageResult;
        img.style.display = "block";
        status.innerText = "✅ Gambar berhasil diubah!";
      } catch (err) {
        console.error("❌ Error:", err);
        status.innerText = "⚠️ " + (err.message || "Terjadi kesalahan.");
      } finally {
        imageGenerateBtn.disabled = false;
        imageGenerateBtn.innerText = "Upload & Generate";
      }
    };
    reader.readAsDataURL(file);
  });

  // 🎨 Hyperbolic Art Generator
  artGenerateBtn?.addEventListener("click", async () => {
    const prompt = artPromptInput.value.trim();
    const model = modelSelect.value;
    if (!prompt) return alert("⚠️ Masukkan prompt untuk menghasilkan gambar.");

    artStatus.innerText = "⏳ Menghasilkan gambar...";
    artGenerateBtn.disabled = true;
    artGenerateBtn.innerText = "Loading...";

    try {
      const res = await fetch("/api/generate-hyperbolic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt, model })
      });

      const result = await res.json();
      if (!res.ok || !result.image_url) throw new Error(result.message || "Tidak ada output dari Hyperbolic AI");

      artImage.src = result.image_url;
      artImage.style.display = "block";
      artStatus.innerText = "✅ Gambar berhasil dibuat.";
    } catch (err) {
      console.error(err);
      artStatus.innerText = "❌ Gagal menghasilkan gambar.";
    } finally {
      artGenerateBtn.disabled = false;
      artGenerateBtn.innerText = "Generate Art";
    }
  });

  // 🔁 Utility Functions
  function togglePopupWith(e, popup, others) {
    e.stopPropagation();
    popup.style.display = popup.style.display === "block" ? "none" : "block";
    others.forEach(p => p.style.display = "none");
  }

  function closeAllPopups(e) {
    const isOutside = (icon, popup) => !popup.contains(e.target) && e.target !== icon;
    if (isOutside(profileIcon, profilePopup)) profilePopup.style.display = "none";
    if (isOutside(emailIcon, emailPopup)) emailPopup.style.display = "none";
    if (isOutside(instaIcon, instaPopup)) instaPopup.style.display = "none";
    if (isOutside(twitterIcon, twitterPopup)) twitterPopup.style.display = "none";
    if (isOutside(mediumIcon, mediumPopup)) mediumPopup.style.display = "none";
    if (isOutside(artIcon, artPopup)) artPopup.style.display = "none";
  }

  function resetImageForm() {
    fileInput.value = "";
    img.src = "";
    img.style.display = "none";
    status.innerText = "";
  }
});
