/**
 * Shared storefront image preview lightbox for review photos.
 */
(function () {
  let overlay = null;

  function injectStyles() {
    if (document.getElementById("jd-media-lightbox-styles")) return;
    const style = document.createElement("style");
    style.id = "jd-media-lightbox-styles";
    style.textContent = `
      .jd-image-lightbox {
        position: fixed;
        inset: 0;
        z-index: 9999999;
        background: rgba(15, 23, 42, 0.9);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
      }
      .jd-image-lightbox.open { display: flex; }
      .jd-image-lightbox-img {
        max-width: min(960px, 100%);
        max-height: 90vh;
        border-radius: 12px;
        object-fit: contain;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
      }
      .jd-image-lightbox-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.95);
        color: #334155;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        display: grid;
        place-items: center;
      }
      .jd-image-lightbox-close:hover { background: #fff; }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    injectStyles();
    overlay = document.createElement("div");
    overlay.className = "jd-image-lightbox";
    overlay.innerHTML =
      '<button type="button" class="jd-image-lightbox-close" aria-label="Close preview">&times;</button>' +
      '<img class="jd-image-lightbox-img" alt="" />';
    overlay.querySelector(".jd-image-lightbox-close").addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay?.classList.contains("open")) close();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function open(url, alt) {
    if (!url) return;
    const el = ensureOverlay();
    const img = el.querySelector(".jd-image-lightbox-img");
    img.src = url;
    img.alt = alt || "Review photo";
    el.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("open");
    const img = overlay.querySelector(".jd-image-lightbox-img");
    img.removeAttribute("src");
    img.alt = "";
    document.body.style.overflow = "";
  }

  function bind(container) {
    if (!container || container.__jdMediaLightboxBound) return;
    container.__jdMediaLightboxBound = true;
    container.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-jd-preview]");
      if (!trigger) return;
      event.preventDefault();
      const url = trigger.getAttribute("data-jd-preview");
      if (url) open(url, trigger.getAttribute("data-jd-preview-alt") || "Review photo");
    });
  }

  window.VerdictMediaLightbox = { open, close, bind, injectStyles };
})();
