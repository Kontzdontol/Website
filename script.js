document.addEventListener("DOMContentLoaded", () => {
  const get = id => document.getElementById(id);

  // === Image Editor Elements ===
  const openImageModalBtn = get("openImageModal");
  const imageModal = get("imageModal");
  const imageGenerateBtn = get("generateImageBtn");
  const fileInput = get("imageInput");
  const status = get("statusImage");
  const img = get("uploadedMemeImage");

  // === Art Generator Elements ===
  const openArtModalBtn = get("openArtModalBtn");
  const artModal = get("artModal");
  const artGenerateBtn = get("generateArtBtn");
  const artPromptInput = get("artPrompt");
  const artImage = get("generatedArtImage");
  const artStatus = get("statusArt");

  // === Popup Elements ===
  const closeEmailBtn = document.querySelector(".close-email");
  const closeArtBtn = document.querySelector(".close-art");
  const profileIcon = get("profileIcon");
  const profilePopup = get("profilePopup");
  const emailIcon = get("emailIcon");
  const emailPopup = get("emailPopup");
  const instaIcon = get("instaIcon");
  const instaPopup = get("instaPopup");
  const twitterIcon = get("twitterIcon");
  const twitterPopup = get("twitterPopup");
  const mediumIcon = get("mediumIcon");
  const mediumPopup = get("mediumPopup");

  // === Modal Show/Hide Logic ===
  const showModal = modal => modal.style.display = "block";
  const hideModal = modal => modal.style.display = "none";

  openImageModalBtn?.addEventListener("click", () => showModal(imageModal));
  openArtModalBtn?.addEventListener("click", () => showModal(artModal));

  document.querySelectorAll(".close").forEach(btn =>
    btn.addEventListener("click", () => {
      hideModal(imageModal);
      resetImageForm();
    })
  );

  closeArtBtn?.addEventListener("click", () => {
    hideModal(artModal);
    resetArtForm();
  });

  window.addEventListener("click", e => {
    if (e.target === imageModal) {
      hideModal(imageModal);
      resetImageForm();
    }
    if (e.target === artModal) {
      hideModal(artModal);
      resetArtForm();
    }
    closeAllPopups(e);
  });

  profileIcon?.addEventListener("click", e => togglePopupWith(e, profilePopup));
  emailIcon?.addEventListener("click", e => togglePopupWith(e, emailPopup));
  instaIcon?.addEventListener("click", e => togglePopupWith(e, instaPopup));
  twitterIcon?.addEventListener("click", e => togglePopupWith(e, twitterPopup));
  mediumIcon?.addEventListener("click", e => togglePopupWith(e, mediumPopup));
  closeEmailBtn?.addEventListener("click", () => emailPopup.style.display = "none");

  // === BFL.AI Image Editing ===
  imageGenerateBtn?.addEventListener("click", async () => {
    const file = fileInput.files[0];
    const userPrompt = prompt("Apa yang ingin kamu ubah dari gambar ini?");
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
          headers: { "Content-Type": "application/json" },
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

  // === Hyperbolic Art Generator === (Default model only)
  artGenerateBtn?.addEventListener("click", async () => {
    const prompt = artPromptInput.value.trim();
    if (!prompt) return alert("🖌️ Prompt tidak boleh kosong.");

    artStatus.innerText = "⏳ Menghasilkan gambar...";
    artGenerateBtn.disabled = true;
    artGenerateBtn.innerText = "Loading...";

    try {
      const res = await fetch("/api/generate-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model_name: "FLUX.1-dev",
          width: 512,
          height: 512,
          backend: "auto"
        })
      });

      const result = await res.json();
      if (!res.ok || !result.image_url) throw new Error(result.message || "Tidak ada output dari AI");

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

  function togglePopupWith(e, popup) {
    e.stopPropagation();
    const allPopups = [profilePopup, emailPopup, instaPopup, twitterPopup, mediumPopup];
    allPopups.forEach(p => {
      if (p !== popup) p.style.display = "none";
    });
    popup.style.display = (popup.style.display === "block") ? "none" : "block";
  }

  function closeAllPopups(e) {
    const isOutside = (icon, popup) => !popup.contains(e.target) && e.target !== icon;
    if (isOutside(profileIcon, profilePopup)) profilePopup.style.display = "none";
    if (isOutside(emailIcon, emailPopup)) emailPopup.style.display = "none";
    if (isOutside(instaIcon, instaPopup)) instaPopup.style.display = "none";
    if (isOutside(twitterIcon, twitterPopup)) twitterPopup.style.display = "none";
    if (isOutside(mediumIcon, mediumPopup)) mediumPopup.style.display = "none";
  }

  function resetImageForm() {
    fileInput.value = "";
    img.src = "";
    img.style.display = "none";
    status.innerText = "";
  }

  function resetArtForm() {
    artPromptInput.value = "";
    artImage.src = "";
    artImage.style.display = "none";
    artStatus.innerText = "";
  }
});
