document.addEventListener("DOMContentLoaded", () => {
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

  const openArtModalBtn = document.getElementById("openArtModal");
  const artModal = document.getElementById("artModal");
  const closeArtBtn = document.querySelector(".close-art");

  openImageModalBtn?.addEventListener("click", () => {
    imageModal.style.display = "block";
  });

  document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
      imageModal.style.display = "none";
      resetForm();
    });
  });

  window.addEventListener("click", e => {
    if (e.target === imageModal) {
      imageModal.style.display = "none";
      resetForm();
    }
    if (e.target === artModal) {
      artModal.style.display = "none";
    }
  });

  closeArtBtn?.addEventListener("click", () => {
    artModal.style.display = "none";
  });

  openArtModalBtn?.addEventListener("click", () => {
    artModal.style.display = "block";
  });

  profileIcon?.addEventListener("click", e => toggleWith(e, profilePopup, [emailPopup, instaPopup, twitterPopup, mediumPopup, artPopup]));
  emailIcon?.addEventListener("click", e => toggleWith(e, emailPopup, [profilePopup, instaPopup, twitterPopup, mediumPopup, artPopup]));
  instaIcon?.addEventListener("click", e => toggleWith(e, instaPopup, [profilePopup, emailPopup, twitterPopup, mediumPopup, artPopup]));
  twitterIcon?.addEventListener("click", e => toggleWith(e, twitterPopup, [profilePopup, emailPopup, instaPopup, mediumPopup, artPopup]));
  mediumIcon?.addEventListener("click", e => toggleWith(e, mediumPopup, [profilePopup, emailPopup, instaPopup, twitterPopup, artPopup]));
  artIcon?.addEventListener("click", e => toggleWith(e, artPopup, [profilePopup, emailPopup, instaPopup, twitterPopup, mediumPopup]));

  closeEmailBtn?.addEventListener("click", () => {
    emailPopup.style.display = "none";
  });

  function toggleWith(e, popup, others) {
    e.stopPropagation();
    togglePopup(popup);
    hidePopups(others);
  }

  window.addEventListener("click", e => {
    if (!profilePopup.contains(e.target) && e.target !== profileIcon) profilePopup.style.display = "none";
    if (!emailPopup.contains(e.target) && e.target !== emailIcon) emailPopup.style.display = "none";
    if (!instaPopup.contains(e.target) && e.target !== instaIcon) instaPopup.style.display = "none";
    if (!twitterPopup.contains(e.target) && e.target !== twitterIcon) twitterPopup.style.display = "none";
    if (!mediumPopup.contains(e.target) && e.target !== mediumIcon) mediumPopup.style.display = "none";
    if (!artPopup.contains(e.target) && e.target !== artIcon) artPopup.style.display = "none";
  });

  function togglePopup(popup) {
    popup.style.display = (popup.style.display === "block") ? "none" : "block";
  }

  function hidePopups(popups) {
    popups.forEach(p => p.style.display = "none");
  }

  imageGenerateBtn?.addEventListener("click", async () => {
    const file = fileInput.files[0];
    const userPrompt = window.prompt("Apa yang ingin kamu ubah dari gambar ini?\nContoh:\n- Tambahkan kacamata\n- Ubah latar menjadi malam\n- Jadikan wajah seperti kartun");

    if (!file) return alert("⚠️ Pilih gambar terlebih dahulu.");
    if (!userPrompt || userPrompt.trim() === "") return alert("⚠️ Prompt tidak boleh kosong.");

    const prompt = `Edit gambar input ini sesuai instruksi berikut: ${userPrompt}`;
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 20) return alert("❌ Ukuran gambar melebihi 20MB.");

    status.innerText = "📤 Mengunggah gambar...";
    imageGenerateBtn.disabled = true;
    imageGenerateBtn.innerText = "Uploading...";

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
        if (!result?.result?.sample) throw new Error("⏰ Gambar tidak tersedia dari AI.");

        img.src = result.result.sample;
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

  artGenerateBtn?.addEventListener("click", async () => {
    const prompt = artPromptInput.value.trim();
    if (!prompt) return alert("⚠️ Masukkan prompt untuk menghasilkan gambar.");

    artStatus.innerText = "⏳ Menghasilkan gambar...";
    artGenerateBtn.disabled = true;
    artGenerateBtn.innerText = "Loading...";

    try {
      const res = await fetch("/api/generate-art", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      const result = await res.json();
      if (!res.ok || !result.image_url) throw new Error(result.message || "Tidak ada output dari DeepAI");

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

  function resetForm() {
    fileInput.value = "";
    img.src = "";
    img.style.display = "none";
    status.innerText = "";
  }
});
