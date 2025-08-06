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
  const mediumIcon = get("openMediumModal");
  const mediumModal = get("mediumModal");
  const closeMediumBtn = get("closeMediumModal");
  const mediumArticles = get("mediumArticles");
  const mediumArticleContent = get("mediumArticleContent");
  const articleModal = get("articleModal");
  const closeArticleModal = get("closeArticleModal");
  const backToArticles = get("backToArticles");

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

  closeMediumBtn?.addEventListener("click", () => hideModal(mediumModal));
  closeArticleModal?.addEventListener("click", () => hideModal(articleModal));
  backToArticles?.addEventListener("click", () => {
    hideModal(articleModal);
    showModal(mediumModal);
  });

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

  mediumIcon?.addEventListener("click", async e => {
    e.stopPropagation();
    closeAllPopups();
    showModal(mediumModal);
    mediumArticles.innerHTML = 'Loading...';
    try {
      const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@hamzahnorsihab07');
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        mediumArticles.innerHTML = data.items.map(item => `
          <p><a href="#" data-content="${encodeURIComponent(item.content)}" class="article-link">${item.title}</a></p>
        `).join('');
      } else {
        mediumArticles.innerHTML = 'No articles found.';
      }
    } catch {
      mediumArticles.innerHTML = 'Failed to load articles.';
    }
  });

  document.addEventListener('click', e => {
    if (e.target.classList.contains('article-link')) {
      e.preventDefault();
      const content = decodeURIComponent(e.target.getAttribute('data-content'));
      mediumArticleContent.innerHTML = content;
      hideModal(mediumModal);
      showModal(articleModal);
    }
  });

  window.addEventListener("click", e => {
    const target = e.target;
    const allPopups = iconPopupPairs.map(p => p.popup).filter(Boolean);
    const allIcons = iconPopupPairs.map(p => p.icon).filter(Boolean);
    const clickedInside = [...allPopups, ...allIcons].some(el => el.contains(target));
    if (!clickedInside) closeAllPopups();

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
      mediumArticles.innerHTML = "";
    }
  });

  fileInput?.addEventListener("change", () => {
    if (fileInput.files && fileInput.files.length > 0) {
      promptContainer.style.display = "block";
    } else {
      promptContainer.style.display = "none";
    }
  });

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
      const base64Image = reader.result;

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
