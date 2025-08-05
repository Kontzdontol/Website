document.addEventListener("DOMContentLoaded", () => {
  const get = id => document.getElementById(id);

  // === Elements ===
  const openImageModalBtn = get("openImageModal");
  const imageModal = get("imageModal");
  const imageGenerateBtn = get("generateImageBtn");
  const fileInput = get("imageInput");
  const status = get("statusImage");
  const img = get("uploadedMemeImage");
  const promptContainer = get("promptContainer");
  const promptInput = get("imagePrompt");

  const openArtModalBtn = get("openArtModalBtn");
  const artModal = get("artModal");
  const artGenerateBtn = get("generateArtBtn");
  const artPromptInput = get("artPrompt");
  const artImage = get("uploadedArtImage");
  const artStatus = get("statusArt");

  const closeArtBtn = get("closeArtModal");
  const closeImageBtn = get("closeImageModal");

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
  const mediumContent = get("mediumContent");

  const showModal = modal => modal.style.display = "block";
  const hideModal = modal => modal.style.display = "none";

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
  mediumIcon?.addEventListener("click", e => {
    togglePopupWith(e, mediumPopup);
    loadMediumArticles();
  });

  fileInput?.addEventListener("change", () => {
    promptContainer.style.display = fileInput.files.length > 0 ? "block" : "none";
  });

  // === Load Medium Articles ===
  async function loadMediumArticles() {
    if (!mediumContent) return;
    mediumContent.innerHTML = "📖 Memuat artikel Medium...";
    try {
      const response = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@hamzahnorsihab07");
      const data = await response.json();
      if (!data?.items?.length) throw new Error("Tidak ada artikel ditemukan.");

      const html = data.items.slice(0, 5).map(item => `
        <div class="medium-article">
          <a href="${item.link}" target="_blank" rel="noopener">
            <strong>${item.title}</strong><br />
            <small>${new Date(item.pubDate).toLocaleDateString()}</small>
          </a>
        </div>
      `).join("");

      mediumContent.innerHTML = `<div class="medium-list">${html}</div>`;
    } catch (err) {
      console.error(err);
      mediumContent.innerHTML = "⚠️ Gagal memuat artikel Medium.";
    }
  }

  // === Photo Editor ===
  imageGenerateBtn?.addEventListener("click", async () => {
    const file = fileInput?.files?.[0];
    if (!file) return alert("⚠️ Pilih gambar terlebih dahulu.");

    const userPrompt = promptInput?.value.trim();
    if (!userPrompt) return alert("⚠️ Prompt tidak boleh kosong.");
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

        const text = await res.text();
        let result;

        try {
          result = JSON.parse(text);
        } catch {
          throw new Error("❌ Response dari server bukan JSON valid.");
        }

        console.log("📥 [BFL] Response:", result);

        if (!res.ok || !result?.result) {
          throw new Error(result?.message || result?.error || "Gagal memproses gambar.");
        }

        const imageResult =
          result.result?.sample ||
          result.result?.image_url ||
          result.image_url ||
          result.output?.image_url;

        if (!imageResult) throw new Error("⏰ Gambar tidak tersedia dari BFL AI.");

        if (img) {
          img.src = imageResult;
          img.style.display = "block";
        }

        status.innerText = "✅ Gambar berhasil diubah!";
      } catch (err) {
        console.error("❌ Error:", err);
        status.innerText = "⚠️ " + (err.message || "Terjadi kesalahan saat menghubungi AI.");
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

  // === Art Generator ===
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
        throw new Error("❌ Response tidak dapat dibaca. Mungkin bukan JSON valid.");
      }

      console.log("🎯 Response dari /api/generate-art:", result);

      const imageUrl =
        result.image_url ||
        result.url ||
        result.result?.image_url ||
        result.output?.image_url ||
        result.image ||
        result.images?.[0];

      if (!res.ok || !imageUrl) {
        throw new Error(result.message || "Tidak ada output gambar dari AI.");
      }

      if (artImage) {
        artImage.src = imageUrl;
        artImage.style.display = "block";
      }

      artStatus.innerText = "✅ Gambar berhasil dibuat.";
    } catch (err) {
      console.error("❌ Error:", err);
      artStatus.innerText = err.message || "⚠️ Gagal menghasilkan gambar.";
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
    if (popup) popup.style.display = (popup.style.display === "block") ? "none" : "block";
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
    if (fileInput) fileInput.value = "";
    if (promptInput) promptInput.value = "";
    if (promptContainer) promptContainer.style.display = "none";
    if (img) {
      img.src = "";
      img.style.display = "none";
    }
    if (status) status.innerText = "";
  }

  function resetArtForm() {
    if (artPromptInput) artPromptInput.value = "";
    if (artImage) {
      artImage.src = "";
      artImage.style.display = "none";
    }
    if (artStatus) artStatus.innerText = "";
  }
});
