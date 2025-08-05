document.addEventListener("DOMContentLoaded", () => {
  const get = id => document.getElementById(id);

  // === Elemen ===
  const openImageModalBtn = get("openImageModal");
  const imageModal = get("imageModal");
  const closeImageBtn = get("closeImageModal");
  const imageGenerateBtn = get("generateImageBtn");
  const fileInput = get("imageInput");
  const promptInput = get("imagePrompt");
  const promptContainer = get("promptContainer");
  const img = get("uploadedMemeImage");
  const status = get("statusImage");

  const openArtModalBtn = get("openArtModalBtn");
  const artModal = get("artModal");
  const closeArtBtn = get("closeArtModal");
  const artGenerateBtn = get("generateArtBtn");
  const artPromptInput = get("artPrompt");
  const artImage = get("uploadedArtImage");
  const artStatus = get("statusArt");

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

  // === Fungsi bantu ===
  const showModal = modal => modal && (modal.style.display = "block");
  const hideModal = modal => modal && (modal.style.display = "none");

  const togglePopupWith = (e, popup) => {
    e.stopPropagation();
    const allPopups = [profilePopup, emailPopup, instaPopup, twitterPopup, mediumPopup];
    allPopups.forEach(p => {
      if (p !== popup) p.style.display = "none";
    });
    popup.style.display = (popup.style.display === "block") ? "none" : "block";
  };

  const closeAllPopups = e => {
    const isOutside = (icon, popup) => popup && !popup.contains(e.target) && e.target !== icon;
    if (isOutside(profileIcon, profilePopup)) profilePopup.style.display = "none";
    if (isOutside(emailIcon, emailPopup)) emailPopup.style.display = "none";
    if (isOutside(instaIcon, instaPopup)) instaPopup.style.display = "none";
    if (isOutside(twitterIcon, twitterPopup)) twitterPopup.style.display = "none";
    if (isOutside(mediumIcon, mediumPopup)) mediumPopup.style.display = "none";
  };

  const resetImageForm = () => {
    if (fileInput) fileInput.value = "";
    if (promptInput) promptInput.value = "";
    if (promptContainer) promptContainer.style.display = "none";
    if (img) {
      img.src = "";
      img.style.display = "none";
    }
    if (status) status.innerText = "";
  };

  const resetArtForm = () => {
    if (artPromptInput) artPromptInput.value = "";
    if (artImage) {
      artImage.src = "";
      artImage.style.display = "none";
    }
    if (artStatus) artStatus.innerText = "";
  };

  // === Event modal ===
  openImageModalBtn?.addEventListener("click", () => showModal(imageModal));
  openArtModalBtn?.addEventListener("click", () => showModal(artModal));
  closeImageBtn?.addEventListener("click", () => {
    hideModal(imageModal);
    resetImageForm();
  });
  closeArtBtn?.addEventListener("click", () => {
    hideModal(artModal);
    resetArtForm();
  });

  // === Tutup modal jika klik luar area modal ===
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

  // === Social popup toggle ===
  profileIcon?.addEventListener("click", e => togglePopupWith(e, profilePopup));
  emailIcon?.addEventListener("click", e => togglePopupWith(e, emailPopup));
  instaIcon?.addEventListener("click", e => togglePopupWith(e, instaPopup));
  twitterIcon?.addEventListener("click", e => togglePopupWith(e, twitterPopup));
  mediumIcon?.addEventListener("click", e => togglePopupWith(e, mediumPopup));

  // === Tampilkan input prompt jika ada file
  fileInput?.addEventListener("change", () => {
    promptContainer.style.display = fileInput.files.length > 0 ? "block" : "none";
  });

  // === Editor Gambar ===
  imageGenerateBtn?.addEventListener("click", async () => {
    const file = fileInput?.files?.[0];
    if (!file) return alert("⚠️ Pilih gambar terlebih dahulu.");
    if (file.size / 1024 / 1024 > 20) return alert("❌ Ukuran gambar melebihi 20MB.");

    const prompt = promptInput?.value.trim();
    if (!prompt) return alert("⚠️ Prompt tidak boleh kosong.");

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
          body: JSON.stringify({
            prompt: `Edit gambar input ini sesuai instruksi berikut: ${prompt}`,
            input_image: base64Image
          })
        });

        const text = await res.text();
        let result = {};
        try {
          result = JSON.parse(text);
        } catch {
          throw new Error("❌ Response bukan JSON valid.");
        }

        const imageResult =
          result.result?.sample ||
          result.result?.image_url ||
          result.image_url ||
          result.output?.image_url;

        if (!res.ok || !imageResult) {
          throw new Error(result.message || result.error || "❌ Gagal memproses gambar.");
        }

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

    reader.onerror = () => {
      status.innerText = "❌ Gagal membaca gambar.";
      imageGenerateBtn.disabled = false;
      imageGenerateBtn.innerText = "Upload & Generate";
    };

    reader.readAsDataURL(file);
  });

  // === Generator Art ===
  artGenerateBtn?.addEventListener("click", async () => {
    const prompt = artPromptInput?.value.trim();
    if (!prompt) return alert("🖌️ Prompt tidak boleh kosong.");

    artStatus.innerText = "⏳ Menghasilkan gambar...";
    artGenerateBtn.disabled = true;
    artGenerateBtn.innerText = "Loading...";

    try {
      const res = await fetch("/api/generate-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, width: 512, height: 512 })
      });

      const text = await res.text();
      let result = {};
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("❌ Response tidak valid.");
      }

      const imageUrl =
        result.image_url ||
        result.url ||
        result.result?.image_url ||
        result.output?.image_url ||
        result.image ||
        result.images?.[0];

      if (!res.ok || !imageUrl) {
        throw new Error(result.message || "⚠️ Gagal menghasilkan gambar.");
      }

      artImage.src = imageUrl;
      artImage.style.display = "block";
      artStatus.innerText = "✅ Gambar berhasil dibuat.";
    } catch (err) {
      console.error("❌ Error:", err);
      artStatus.innerText = err.message || "⚠️ Terjadi kesalahan.";
    } finally {
      artGenerateBtn.disabled = false;
      artGenerateBtn.innerText = "Generate Art";
    }
  });
});
