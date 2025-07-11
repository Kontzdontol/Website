document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "https://ai-backend-production-2599.up.railway.app"; // ✅ Domain backend kamu

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
  });

  profileIcon?.addEventListener("click", e => toggleWith(e, profilePopup, [emailPopup, instaPopup, twitterPopup, mediumPopup]));
  emailIcon?.addEventListener("click", e => toggleWith(e, emailPopup, [profilePopup, instaPopup, twitterPopup, mediumPopup]));
  instaIcon?.addEventListener("click", e => toggleWith(e, instaPopup, [profilePopup, emailPopup, twitterPopup, mediumPopup]));
  twitterIcon?.addEventListener("click", e => toggleWith(e, twitterPopup, [profilePopup, emailPopup, instaPopup, mediumPopup]));
  mediumIcon?.addEventListener("click", e => toggleWith(e, mediumPopup, [profilePopup, emailPopup, instaPopup, twitterPopup]));

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
  });

  function togglePopup(popup) {
    popup.style.display = (popup.style.display === "block") ? "none" : "block";
  }

  function hidePopups(popups) {
    popups.forEach(p => p.style.display = "none");
  }

  imageGenerateBtn?.addEventListener("click", async () => {
    const file = fileInput.files[0];
    const prompt = window.prompt("Apa yang ingin kamu ubah dari gambar ini?");
    if (!file) return alert("⚠️ Pilih gambar terlebih dahulu.");
    if (!prompt || prompt.trim() === "") return alert("⚠️ Prompt tidak boleh kosong.");

    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 20) return alert("❌ Ukuran gambar melebihi 20MB.");

    status.innerText = "📤 Mengunggah gambar...";
    imageGenerateBtn.disabled = true;
    imageGenerateBtn.innerText = "Uploading...";

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result.split(",")[1];

      try {
        const res = await fetch(`${BACKEND_URL}/generate-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ prompt, input_image: base64Image })
        });

        if (!res.ok) throw new Error(await res.text());

        const { polling_url } = await res.json();
        if (!polling_url) throw new Error("Polling URL tidak tersedia.");

        status.innerText = "⏳ Memproses gambar di AI...";
        const result = await pollForResult(polling_url);

        if (!result?.result?.sample) throw new Error("⏰ Timeout atau gambar tidak tersedia.");
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

  async function pollForResult(url) {
    try {
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const poll = await fetch(`${BACKEND_URL}/poll?url=${encodeURIComponent(url)}`);
        const data = await poll.json();

        console.log(`[Polling] Status: ${data.status}`);
        if (data.status === "Ready") return data;
        if (["Error", "Failed"].includes(data.status)) throw new Error(data.error || "Gagal memproses gambar.");
      }
      throw new Error("Polling timeout.");
    } catch (err) {
      throw new Error("Gagal polling hasil dari backend: " + err.message);
    }
  }

  function resetForm() {
    fileInput.value = "";
    img.src = "";
    img.style.display = "none";
    status.innerText = "";
  }
});
