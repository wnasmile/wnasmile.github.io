/* ================= CONFIG ================= */

const SUPPORT_URL = "https://youtube.com/@rhap5ody?si=ZOALGkmYfo_c96xL";
const REPO_API = "https://api.github.com/repos/sundaezipper/sundaezipper.github.io/git/trees/main?recursive=1";
const BASE_URL = "https://raw.githubusercontent.com/sundaezipper/sundaezipper.github.io/main/";

/* ================= ELEMENTS ================= */

const downloadBtn = document.getElementById("download");
const supportBtn = document.getElementById("support");
const overlay = document.getElementById("overlay");
const zipSound = document.getElementById("zipSound");

/* ================= TOAST ALERT ================= */

function showDownloadToast(message, success = false) {
  let toast = document.querySelector(".download-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "download-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.toggle("success", success);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
  }, success ? 2500 : 4000);
}

/* ================= SUPPORT ================= */

supportBtn.addEventListener("click", () => {
  window.open(SUPPORT_URL, "_blank");
});

/* ================= DOWNLOAD ZIP ================= */

downloadBtn.addEventListener("click", async () => {
  overlay.style.display = "block";
  showDownloadToast("Preparing ZIP...");

  if (zipSound.src) {
    zipSound.currentTime = 0;
    zipSound.play().catch(() => {});
  }

  try {
    // Fetch repo file list dynamically
    const res = await fetch(REPO_API);
    if (!res.ok) throw new Error("Failed to fetch repo file list.");
    const data = await res.json();

    const zip = new JSZip();

    // Filter out directories, only include files
    const files = data.tree.filter(item => item.type === "blob").map(item => item.path);

    // Fetch each file and add to ZIP
    await Promise.all(
      files.map(async (file) => {
        const response = await fetch(BASE_URL + file);
        const arrayBuffer = await response.arrayBuffer();
        zip.file(file, arrayBuffer, { binary: true });
      })
    );

    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wnasmile.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showDownloadToast("Download complete!", true);
  } catch (err) {
    console.error("ZIP ERROR:", err);
    alert("Failed to create ZIP. Check console for details.");
  } finally {
    overlay.style.display = "none";
  }
});