document.addEventListener("DOMContentLoaded", () => {
  const get = id => document.getElementById(id);

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
  const mediumModal = get("mediumModal");
  const closeMediumBtn = get("closeMediumModal");
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

  closeMediumBtn?.addEventListener("click", () => {
    hideModal(mediumModal);
    mediumContent.innerHTML = "";
  });

  // === Icon Click Handling ===
  const iconPopupPairs = [
    { icon: profileIcon, popup: profilePopup },
    { icon: emailIcon, popup: emailPopup },
    { icon: instaIcon, popup: instaPopup },
    { icon: twitterIcon, popup: twitterPopup }
  ];

  iconPopupPairs.forEach(({ icon, popup }) => {
    icon?.addEventListener("click", e => {
      e.stopPropagation();
      closeAllPopups();
      if (popup) {
        const rect = icon.getBoundingClientRect();
        popup.style.display = "block";
        popup.style.top = `${rect.top}px`;
        popup.style.left = `${rect.right + 10}px`;
      }
    });
  });

  mediumIcon?.addEventListener("click", e => {
    e.stopPropagation();
    closeAllPopups();
    showModal(mediumModal);
    loadMediumArticles();
  });

  // === Close popups if click outside
  window.addEventListener("click", e => {
    const target = e.target;
    const allPopups = iconPopupPairs.map(p => p.popup).filter(Boolean);
    const allIcons = iconPopupPairs.map(p => p.icon).filter(Boolean);

    const clickedInside = [...allPopups, ...allIcons].some(el => el.contains(target));
    if (!clickedInside) {
      closeAllPopups();
    }

    if (target === imageModal) {
      hideModal(imageModal);
      resetImageForm();
    }
    if (target === artModal) {
      hideModal(artModal);
      resetArtForm();
    }
    if (target === mediumModal) {
      hideModal(mediumModal);
      mediumContent.innerHTML = "";
    }
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

      const html = data.items.map((item, index) => `
        <div class="medium-article">
          <a href="#" data-index="${index}">
            <strong>${item.title}</strong><br />
            <small>${new Date(item.pubDate).toLocaleDateString()}</small>
          </a>
        </div>
      `).join("");

      mediumContent.innerHTML = `<div class="medium-list">${html}</div>`;

      document.querySelectorAll(".medium-article a").forEach((a, i) => {
        a.addEventListener("click", e => {
          e.preventDefault();
          showArticleContent(data.items[i]);
        });
      });
    } catch (err) {
      console.error(err);
      mediumContent.innerHTML = "⚠️ Gagal memuat artikel Medium.";
    }
  }

  function showArticleContent(article) {
    if (!article || !mediumContent) return;
    mediumContent.innerHTML = `
      <div class="medium-full-article">
        <button id="backToList">⬅ Kembali ke daftar</button>
        <h2>${article.title}</h2>
        <p><em>${new Date(article.pubDate).toLocaleDateString()}</em></p>
        <div class="medium-body">${article.content}</div>
      </div>
    `;
    document.getElementById("backToList")?.addEventListener("click", loadMediumArticles);
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

        const result = await res.json();

        const imageResult =
          result.result?.sample ||
          result.result?.image_url ||
          result.image_url ||
          result.output?.image_url;

        if (!res.ok || !imageResult) throw new Error(result?.message || "Gagal memproses gambar.");

        img.src = imageResult;
        img.style.display = "block";
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

      const result = await res.json();

      const imageUrl =
        result.image_url ||
        result.url ||
        result.result?.image_url ||
        result.output?.image_url ||
        result.image ||
        result.images?.[0];

      if (!res.ok || !imageUrl) throw new Error(result.message || "Tidak ada output gambar dari AI.");

      artImage.src = imageUrl;
      artImage.style.display = "block";
      artStatus.innerText = "✅ Gambar berhasil dibuat.";
    } catch (err) {
      console.error("❌ Error:", err);
      artStatus.innerText = err.message || "⚠️ Gagal menghasilkan gambar.";
    } finally {
      artGenerateBtn.disabled = false;
      artGenerateBtn.innerText = "Generate Art";
    }
  });

  function closeAllPopups() {
    iconPopupPairs.forEach(({ popup }) => {
      if (popup) popup.style.display = "none";
    });
  }

  function resetImageForm() {
    fileInput.value = "";
    promptInput.value = "";
    promptContainer.style.display = "none";
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
