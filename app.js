/**
 * ADEEL USMAN - MASTER PORTFOLIO INTERACTION ENGINE
 * Features:
 * 1. Individual 3D Rotating Polygon Showcases for Each Website (Vantria, P Fill, GJ Practice)
 *    - Continuous 3D rotation without clicking
 *    - Pauses ONLY when mouse is directly over an actual image/face (not whole card/box)
 *    - Next / Prev buttons and interactive thumbnail navigation
 *    - ZERO automatic window scrolling
 * 2. Result Sheet Modal (Matric & Intermediate with High-Res View and PDF Download)
 * 3. Fullscreen Image Lightbox Modal with Zoom & Navigation
 * 4. Smooth Card Entrance Animations on Scroll
 * 5. Theme Toggle (Cyber Yellow Obsidian & Golden Light)
 */

let isInitialized = false;
function initAll() {
  if (isInitialized) return;
  isInitialized = true;
  init3DCanvasBackground();
  init3DTilt();
  initCounters();
  initProjectPolygons();
  initLiveSandboxes();
  initResultModals();
  initLightbox();
  initScrollAnimations();
  initThemeToggle();
  initMobileMenu();
  initMailLinks();
}

// Run on DOMContentLoaded or immediately if already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll);
} else {
  initAll();
}

/* ==========================================================================
   1. INDIVIDUAL 3D ROTATING POLYGON SHOWCASES PER WEBSITE
   ========================================================================== */
const polygonInstances = [];

function initProjectPolygons() {
  const polygonWraps = document.querySelectorAll(".project-polygon-wrap");
  if (!polygonWraps.length) return;

  polygonWraps.forEach((wrap, projectIndex) => {
    const rotor = wrap.querySelector(".polygon-3d-rotor");
    const scene = wrap.querySelector(".polygon-3d-scene");
    const faces = Array.from(wrap.querySelectorAll(".polygon-face"));
    const thumbs = Array.from(wrap.querySelectorAll(".polygon-thumb-item"));
    const leftBtn = wrap.querySelector(".arrow-left");
    const rightBtn = wrap.querySelector(".arrow-right");
    const captionBar = wrap.querySelector(".polygon-caption-bar");
    const numFaces = faces.length;

    if (!rotor || numFaces === 0) return;

    const stepAngle = 360 / numFaces;
    let angle = 0;
    let isHovered = false;
    let isTransitioning = false;
    let isDragging = false;
    let startX = 0;
    let dragAngleStart = 0;
    let lastActiveIdx = 0;
    let resumeTimeout = null;

    // Continuous rotation speed (~8 deg/sec for smooth, relaxed viewing)
    const autoSpeed = 0.14;

    const instanceData = {
      wrap,
      rotor,
      faces,
      thumbs,
      numFaces,
      stepAngle,
      getCurrentIndex: () => lastActiveIdx,
      stepToFace: (idx) => stepToFace(idx),
    };
    polygonInstances.push(instanceData);

    // Update active thumbnail class and caption bar (NEVER scrolls document)
    function updateActiveState(idx) {
      if (idx === lastActiveIdx && thumbs[idx]?.classList.contains("active"))
        return;
      lastActiveIdx = idx;

      thumbs.forEach((t, i) => {
        if (i === idx) {
          t.classList.add("active");
          const strip = t.parentElement;
          if (strip && strip.scrollWidth > strip.clientWidth) {
            strip.scrollTo({
              left: t.offsetLeft - strip.clientWidth / 2 + t.offsetWidth / 2,
              behavior: "smooth",
            });
          }
        } else {
          t.classList.remove("active");
        }
      });

      if (captionBar && faces[idx]) {
        const cap =
          faces[idx].getAttribute("data-caption") ||
          faces[idx].querySelector("img")?.alt ||
          "";
        captionBar.textContent = cap;
      }
    }

    // 60fps Continuous Rotation Loop
    function renderLoop() {
      if (!isHovered && !isTransitioning && !isDragging) {
        angle = (angle - autoSpeed) % 360;
        rotor.style.transition = "none";
        rotor.style.transform = `rotateY(${angle}deg)`;

        // Calculate which face is currently pointing frontwards
        const normalized = ((-angle % 360) + 360) % 360;
        const currentActive = Math.round(normalized / stepAngle) % numFaces;
        updateActiveState(currentActive);
      }

      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);

    // CRITICAL REQUIREMENT: Pause rotation ONLY when mouse is directly over an actual face image,
    // NOT when it's anywhere else inside the container/box!
    faces.forEach((face) => {
      face.addEventListener("mouseenter", () => {
        isHovered = true;
      });

      face.addEventListener("mouseleave", () => {
        isHovered = false;
        isTransitioning = false;
      });
    });

    // Interactive Drag-to-Spin
    if (scene) {
      // Mouse drag to spin
      scene.addEventListener("mousedown", (e) => {
        if (
          e.target.closest(".polygon-arrow") ||
          e.target.closest(".polygon-face")
        )
          return;
        isDragging = true;
        startX = e.clientX;
        dragAngleStart = angle;
        clearTimeout(resumeTimeout);
      });

      window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        angle = dragAngleStart + dx * 0.45;
        rotor.style.transition = "none";
        rotor.style.transform = `rotateY(${angle}deg)`;
        const normalized = ((-angle % 360) + 360) % 360;
        const currentActive = Math.round(normalized / stepAngle) % numFaces;
        updateActiveState(currentActive);
      });

      window.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        const normalized = ((-angle % 360) + 360) % 360;
        const nearestIdx = Math.round(normalized / stepAngle) % numFaces;
        stepToFace(nearestIdx);
      });

      // Touch drag for mobile / tablets
      scene.addEventListener(
        "touchstart",
        (e) => {
          if (
            e.target.closest(".polygon-arrow") ||
            e.target.closest(".polygon-face")
          )
            return;
          if (!e.touches[0]) return;
          isDragging = true;
          startX = e.touches[0].clientX;
          dragAngleStart = angle;
          clearTimeout(resumeTimeout);
        },
        { passive: true },
      );

      window.addEventListener(
        "touchmove",
        (e) => {
          if (!isDragging || !e.touches[0]) return;
          const dx = e.touches[0].clientX - startX;
          angle = dragAngleStart + dx * 0.45;
          rotor.style.transition = "none";
          rotor.style.transform = `rotateY(${angle}deg)`;
          const normalized = ((-angle % 360) + 360) % 360;
          const currentActive = Math.round(normalized / stepAngle) % numFaces;
          updateActiveState(currentActive);
        },
        { passive: true },
      );

      window.addEventListener("touchend", () => {
        if (!isDragging) return;
        isDragging = false;
        const normalized = ((-angle % 360) + 360) % 360;
        const nearestIdx = Math.round(normalized / stepAngle) % numFaces;
        stepToFace(nearestIdx);
      });
    }

    // Smoothly step rotation to align a specific face to the front
    function stepToFace(targetIdx) {
      isTransitioning = true;
      clearTimeout(resumeTimeout);

      // Find closest continuous angle to reach target face
      const currentNorm = -angle;
      const currentCycle = Math.floor(currentNorm / 360) * 360;
      let destNorm = currentCycle + targetIdx * stepAngle;

      const diff = destNorm - currentNorm;
      if (diff > 180) destNorm -= 360;
      if (diff < -180) destNorm += 360;

      angle = -destNorm;

      rotor.style.transition = "transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)";
      rotor.style.transform = `rotateY(${angle}deg)`;
      updateActiveState(targetIdx);

      // Resume auto-rotation after 3.2s of inactivity
      resumeTimeout = setTimeout(() => {
        isTransitioning = false;
      }, 3200);
    }

    // Arrow Left / Right navigation buttons
    if (leftBtn) {
      leftBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const prevIdx = (lastActiveIdx - 1 + numFaces) % numFaces;
        stepToFace(prevIdx);
      });
    }

    if (rightBtn) {
      rightBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nextIdx = (lastActiveIdx + 1) % numFaces;
        stepToFace(nextIdx);
      });
    }

    // Thumbnail click to rotate to that image
    thumbs.forEach((thumb, idx) => {
      thumb.addEventListener("click", (e) => {
        e.stopPropagation();
        stepToFace(idx);
      });
    });

    // Clicking any face on the 3D polygon:
    faces.forEach((face, idx) => {
      // 1. Expand button opens image in fullscreen Lightbox modal
      const expandBtn = face.querySelector(".face-expand-btn");
      if (expandBtn) {
        expandBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          openLightbox(projectIndex, idx);
        });
      }

      // 2. Clicking anywhere on the screenshot face navigates to the target website at that particular section/page
      face.addEventListener("click", (e) => {
        if (e.target.closest(".face-expand-btn")) return;
        if (e.target.closest("a")) return; // natural anchor click handles navigation
        const link = face.querySelector("a.face-screenshot-link");
        if (link && link.href) {
          e.stopPropagation();
          window.open(link.href, "_blank", "noopener,noreferrer");
        }
      });
    });

    // Set initial caption and active thumbnail
    updateActiveState(0);
  });
}

/* ==========================================================================
   LIVE INTERACTIVE SANDBOXES (VANTRIA, PFILL, GJ PRACTICE)
   - Real interactive embedded browsers with zero static snapshots
   - Multi-viewport & anchor hash caching for ultra-fast tab navigation
   - Smooth programmatic anchor scrolling to exact sections
   - High-tech gold cybernetic loaders with automatic reveal on load
   ========================================================================== */
function initLiveSandboxes() {
  setupVantriaSandbox();
  setupGenericSandbox(
    "pfill",
    "https://paperfill.pages.dev/",
    "paperfill-preview.html",
  );
  setupGenericSandbox(
    "gj",
    "https://gjpractice.pages.dev/",
    "gjpractice-preview.html",
  );
  setupGenericSandbox(
    "weather",
    "https://main.d2jet8k9ib6fge.amplifyapp.com/",
    "weathernow-preview.html",
  );
}

function scrollElementInIframe(iframe, targetHash, targetAction, onDocReady) {
  if (!iframe) return;

  // 1. PostMessage: 100% reliable across all origins, file:// protocol, and sandboxed contexts (Instant 0ms)
  try {
    if (iframe.contentWindow) {
      if (targetAction === 'open-manual-cvt') {
        iframe.contentWindow.postMessage({ action: 'open_manual_cvt' }, '*');
      } else if (targetAction === 'open-settings') {
        iframe.contentWindow.postMessage({ action: 'open_settings' }, '*');
      } else if (targetAction === 'close-settings') {
        iframe.contentWindow.postMessage({ action: 'close_settings' }, '*');
      }
      if (targetHash) {
        iframe.contentWindow.postMessage({ action: 'scroll_to', targetId: targetHash }, '*');
      }
    }
  } catch (e) {}

  // 2. Direct DOM Access when same-origin (Instant 0ms execution)
  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      if (typeof onDocReady === 'function') {
        onDocReady(doc);
      }
      let el = doc.getElementById(targetHash);
      if (!el && (targetHash === 'booking-form' || targetHash === 'booking-form-wrap')) {
        el = doc.getElementById('booking-form-wrap') || doc.querySelector('form#booking-form') || doc.querySelector('.hero-form-card');
      }
      if (!el && targetHash === 'why-choose') {
        el = doc.getElementById('why-choose-header') || doc.getElementById('why-choose');
      }
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    }
  } catch (e) {}
}

function setupVantriaSandbox() {
  const container = document.getElementById("vantriaSandboxContainer");
  const loader = document.getElementById("vantriaLoader");
  const urlDisplay = document.getElementById("vantriaUrlDisplay");
  const quickBtns = document.querySelectorAll(
    ".vantria-sandbox .sandbox-quick-btn",
  );
  const reloadBtn = document.getElementById("vantriaReloadBtn");
  const resetBtn = document.getElementById("vantriaResetBtn");
  const backBtn = document.getElementById("vantriaBackBtn");
  const fwdBtn = document.getElementById("vantriaFwdBtn");

  const iframes = {
    home: document.getElementById("vantriaIframeHome"),
    fleet: document.getElementById("vantriaIframeFleet"),
    contact: document.getElementById("vantriaIframeContact"),
  };

  if (!container || !iframes.home) return;

  let activeIframe = iframes.home;

  // Reveal as soon as home iframe loads
  iframes.home.addEventListener("load", () => {
    if (loader) loader.classList.add("loaded");
  });

  // Safety fallback so loader never gets stuck if event fired early
  setTimeout(() => {
    if (loader) loader.classList.add("loaded");
  }, 2500);

  function ensureIframe(ifr, targetUrl) {
    if (!ifr) return;
    const dataSrc = targetUrl || ifr.getAttribute("data-src");
    if (!ifr.src || ifr.src === "about:blank") {
      ifr.src = dataSrc;
    }
  }

  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      quickBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const tabType = btn.getAttribute("data-tab");
      const targetHash = btn.getAttribute("data-hash");
      const targetUrl = btn.getAttribute("data-url");
      if (urlDisplay) urlDisplay.textContent = targetUrl;

      let targetIframe = iframes.home;
      if (tabType === "fleet") targetIframe = iframes.fleet;
      else if (tabType === "contact") targetIframe = iframes.contact;

      Object.values(iframes).forEach((ifr) => ifr?.classList.remove("active"));
      if (targetIframe) {
        targetIframe.classList.add("active");
        activeIframe = targetIframe;
      }

      if (targetIframe === iframes.home) {
        if (targetHash) {
          scrollElementInIframe(iframes.home, targetHash);
        }
      } else {
        ensureIframe(targetIframe, targetUrl);
      }
    });
  });

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      if (activeIframe) activeIframe.src = activeIframe.src;
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // No section selected in beginning
      quickBtns.forEach((b) => b.classList.remove("active"));
      const defaultUrl = "https://vantriaprivatetransit-28117.web.app/";
      if (urlDisplay) urlDisplay.textContent = defaultUrl;
      Object.values(iframes).forEach((ifr) => ifr?.classList.remove("active"));
      iframes.home?.classList.add("active");
      activeIframe = iframes.home;
      try {
        iframes.home?.contentWindow?.postMessage({ action: 'scroll_to', targetId: 'top' }, '*');
      } catch (e) {}
      try {
        iframes.home?.contentWindow?.scrollTo({ top: 0, behavior: 'auto' });
      } catch (e) {}
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      try {
        activeIframe?.contentWindow.history.back();
      } catch (e) {}
    });
  }
  if (fwdBtn) {
    fwdBtn.addEventListener("click", () => {
      try {
        activeIframe?.contentWindow.history.forward();
      } catch (e) {}
    });
  }
}

function setupGenericSandbox(prefix, defaultUrl, previewFile) {
  const iframe = document.getElementById(`${prefix}Iframe`);
  const loader = document.getElementById(`${prefix}Loader`);
  const urlDisplay = document.getElementById(`${prefix}UrlDisplay`);
  const quickBtns = document.querySelectorAll(
    `.${prefix}-sandbox .sandbox-quick-btn`,
  );
  const reloadBtn = document.getElementById(`${prefix}ReloadBtn`);
  const resetBtn = document.getElementById(`${prefix}ResetBtn`);
  const backBtn = document.getElementById(`${prefix}BackBtn`);
  const fwdBtn = document.getElementById(`${prefix}FwdBtn`);

  if (!iframe) return;

  iframe.addEventListener("load", () => {
    if (loader) loader.classList.add("loaded");
  });

  setTimeout(() => {
    if (loader) loader.classList.add("loaded");
  }, 2500);

  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      quickBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const targetHash = btn.getAttribute("data-hash");
      const targetAction = btn.getAttribute("data-action");
      const targetUrl = btn.getAttribute("data-url");
      if (urlDisplay) urlDisplay.textContent = targetUrl;

      scrollElementInIframe(iframe, targetHash, targetAction, (doc) => {
        // Specific DOM action hooks for PFill (Directly enters CVT-1 and IT-5 manual entry mode)
        if (prefix === "pfill") {
          if (targetAction === "open-manual-cvt" || targetHash === "manual-mode-card") {
            const cvtTabBtn = doc.getElementById("tab-btn-cvt-it5");
            if (cvtTabBtn) cvtTabBtn.click();
            const manualCard = doc.getElementById("manual-mode-card");
            if (manualCard) manualCard.click();
            const closeBtn = doc.getElementById("modal-close-btn");
            const modal = doc.getElementById("ai-modal");
            if (modal && !modal.classList.contains("hidden") && closeBtn) closeBtn.click();
            const target = doc.getElementById("results-grid") || doc.getElementById("manual-notice") || manualCard;
            if (target) target.scrollIntoView({ behavior: "auto", block: "start" });
            const firstInput = doc.getElementById("purchaser-name");
            if (firstInput) firstInput.focus();
          } else if (targetAction === "open-settings") {
            const apiBtn = doc.getElementById("ai-settings-btn");
            if (apiBtn) apiBtn.click();
          } else {
            const closeBtn = doc.getElementById("modal-close-btn");
            const modal = doc.getElementById("ai-modal");
            if (modal && !modal.classList.contains("hidden") && closeBtn) {
              closeBtn.click();
            }
          }
        }

        // Specific DOM action hooks for GJ Practice
        if (prefix === "gj") {
          if (targetHash === "watSetupSection") {
            doc.querySelector('button[data-test="wat"]')?.click();
          } else if (targetHash === "pictureSetupSection") {
            doc.querySelector('button[data-test="picture"]')?.click();
          } else if (targetHash === "pointerSetupSection") {
            doc.querySelector('button[data-test="pointer"]')?.click();
          } else if (targetAction === "open-ocr" || targetHash === "imageTab") {
            doc.querySelector('button[data-test="wat"]')?.click();
            doc.querySelector('button[data-tab="imageTab"]')?.click();
          }
        }
      });
    });
  });

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      iframe.src = iframe.src;
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // No section selected in beginning
      quickBtns.forEach((b) => b.classList.remove("active"));
      if (urlDisplay) urlDisplay.textContent = defaultUrl;
      try {
        iframe.contentWindow?.postMessage({ action: 'scroll_to', targetId: 'top' }, '*');
      } catch (e) {}
      if (prefix === "pfill") {
        try {
          iframe.contentWindow?.postMessage({ action: 'close_settings' }, '*');
        } catch (e) {}
      }
      try {
        iframe.contentWindow?.scrollTo({ top: 0, behavior: 'auto' });
      } catch (e) {}
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      try {
        iframe.contentWindow.history.back();
      } catch (e) {}
    });
  }
  if (fwdBtn) {
    fwdBtn.addEventListener("click", () => {
      try {
        iframe.contentWindow.history.forward();
      } catch (e) {}
    });
  }
}

/* ==========================================================================
   2. RESULT SHEET MODAL (Matric & Intermediate Result Cards - View Only)
   ========================================================================== */
function initResultModals() {
  const modal = document.getElementById("resultModal");
  const modalImg = document.getElementById("resultModalImg");
  const modalTitle = document.getElementById("resultModalTitle");
  const closeBtn = document.getElementById("resultModalClose");
  const buttons = document.querySelectorAll(".btn-result-sheet");

  if (!modal) return;

  function closeResultModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (closeBtn) closeBtn.addEventListener("click", closeResultModal);

  modal.addEventListener("click", (e) => {
    if (
      e.target === modal ||
      e.target.classList.contains("result-modal-body")
    ) {
      closeResultModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeResultModal();
    }
  });

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const imgSrc = btn.getAttribute("data-result-img");
      const title = btn.getAttribute("data-title");

      if (modalImg && imgSrc) {
        modalImg.src = imgSrc;
        modalImg.alt = title || "Official Examination Result Sheet";
      }
      if (modalTitle && title) modalTitle.textContent = title;

      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  });
}

/* ==========================================================================
   3. FULLSCREEN IMAGE LIGHTBOX MODAL (Project Screenshots)
   ========================================================================== */
let currentLightboxProject = 0;
let currentLightboxIndex = 0;

function initLightbox() {
  const modal = document.getElementById("lightboxModal");
  const closeBtn = document.getElementById("lightboxCloseBtn");
  const prevBtn = document.getElementById("lightboxPrevBtn");
  const nextBtn = document.getElementById("lightboxNextBtn");

  if (!modal) return;

  function closeLightbox() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);

  modal.addEventListener("click", (e) => {
    if (
      e.target === modal ||
      e.target.classList.contains("lightbox-img-wrapper")
    ) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextLightbox();
    if (e.key === "ArrowLeft") prevLightbox();
  });

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      nextLightbox();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      prevLightbox();
    });
  }
}

function openLightbox(projectIdx, imageIdx) {
  const modal = document.getElementById("lightboxModal");
  if (!modal || !polygonInstances[projectIdx]) return;

  currentLightboxProject = projectIdx;
  currentLightboxIndex = imageIdx;

  updateLightboxContent();

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function updateLightboxContent() {
  const imgEl = document.getElementById("lightboxImg");
  const captionEl = document.getElementById("lightboxCaption");

  const instance = polygonInstances[currentLightboxProject];
  if (!instance) return;

  const currentFace = instance.faces[currentLightboxIndex];
  if (!currentFace) return;

  const activeImg = currentFace.querySelector("img");
  const caption =
    currentFace.getAttribute("data-caption") || activeImg?.alt || "";

  if (activeImg && imgEl) {
    imgEl.src = activeImg.src;
    imgEl.alt = caption;
  }
  if (captionEl) captionEl.textContent = caption;

  // Align background 3D polygon to this image
  instance.stepToFace(currentLightboxIndex);
}

function nextLightbox() {
  const instance = polygonInstances[currentLightboxProject];
  if (!instance) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % instance.numFaces;
  updateLightboxContent();
}

function prevLightbox() {
  const instance = polygonInstances[currentLightboxProject];
  if (!instance) return;
  currentLightboxIndex =
    (currentLightboxIndex - 1 + instance.numFaces) % instance.numFaces;
  updateLightboxContent();
}

/* ==========================================================================
   4. SCROLL & ENTRANCE ANIMATIONS (All content moves from left/right slowly)
   ========================================================================== */
function initScrollAnimations() {
  const flowElements = Array.from(
    document.querySelectorAll(".flow-from-left, .flow-from-right"),
  );
  if (!flowElements.length) return;

  const vh = window.innerHeight || document.documentElement.clientHeight || 800;

  function activateFlowing(el) {
    let triggered = false;
    const startFlow = () => {
      if (triggered) return;
      triggered = true;
      el.classList.add("is-flowing", "is-floating");
    };
    // Hand off seamlessly at the exact moment entrance transition completes (0ms break)
    el.addEventListener("transitionend", (e) => {
      if (e.propertyName === "transform") {
        startFlow();
      }
    }, { once: true });
    // Safety fallback
    setTimeout(startFlow, 1350);
  }

  // Initialize: elements below initial viewport start with will-fly-in
  flowElements.forEach((el) => {
    // Hero section elements animate immediately on page entrance
    if (el.closest(".hero-section")) {
      activateFlowing(el);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top > vh - 40) {
      el.classList.add("will-fly-in");
    } else {
      el.classList.add("is-in-view");
      activateFlowing(el);
    }
  });

  // Use hardware-accelerated IntersectionObserver for smooth 60fps/120fps entrance glide
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (
              el.classList.contains("will-fly-in") &&
              !el.classList.contains("is-in-view")
            ) {
              el.classList.add("is-in-view");
              activateFlowing(el);

              // Also trigger nested project content text inside project box if present
              const innerContent = el.querySelector(".project-content");
              if (
                innerContent &&
                innerContent.classList.contains("will-fly-in")
              ) {
                innerContent.classList.add("is-in-view");
                activateFlowing(innerContent);
              }
            }
            // Elements gracefully stay in view once revealed (no jarring resets or jumps)
            observer.unobserve(el);
          }
        });
      },
      {
        root: null,
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    flowElements.forEach((el) => {
      if (el.classList.contains("will-fly-in")) {
        observer.observe(el);
      }
    });
  } else {
    // Graceful fallback for older browsers
    function checkReveal() {
      const currentVh =
        window.innerHeight || document.documentElement.clientHeight || 800;
      flowElements.forEach((el) => {
        if (
          !el.classList.contains("will-fly-in") ||
          el.classList.contains("is-in-view")
        )
          return;
        const rect = el.getBoundingClientRect();
        if (rect.top < currentVh - 40) {
          el.classList.add("is-in-view");
          activateFlowing(el);
        }
      });
    }
    window.addEventListener("scroll", checkReveal, { passive: true });
    checkReveal();
  }
}

/* ==========================================================================
   5. THEME TOGGLE (Cyber Yellow Obsidian & Golden Light)
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem("adeel_theme_yellow") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButton(savedTheme);

  toggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const newTheme = current === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("adeel_theme_yellow", newTheme);
    updateThemeButton(newTheme);
  });

  function updateThemeButton(theme) {
    const isDark = theme === "dark";
    toggleBtn.innerHTML = isDark
      ? '<span class="theme-icon">☀️</span><span class="theme-label"> Light</span>'
      : '<span class="theme-icon">🌙</span><span class="theme-label"> Dark</span>';
    toggleBtn.setAttribute("title", isDark ? "Switch to Light Mode" : "Switch to Dark Mode");
    toggleBtn.setAttribute("aria-label", isDark ? "Switch to Light Mode" : "Switch to Dark Mode");
  }
}

/* ==========================================================================
   6. INTERACTIVE 3D CANVAS BACKGROUND (Stars & Rotating Polyhedron)
   ========================================================================== */
function init3DCanvasBackground() {
  const canvas = document.getElementById("bg3dCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  let mouseX = 0;
  let mouseY = 0;
  let targetRotX = 0;
  let targetRotY = 0;
  let curRotX = 0;
  let curRotY = 0;

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / width - 0.5) * 2;
    mouseY = (e.clientY / height - 0.5) * 2;
    targetRotY = mouseX * 0.45;
    targetRotX = -mouseY * 0.45;
  });

  // 3D Particles Field
  const NUM_PARTICLES = 75;
  const particles = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 1600,
      y: (Math.random() - 0.5) * 1200,
      z: Math.random() * 1000 + 100,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      vz: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 2 + 1,
      color: Math.random() > 0.3 ? "#facc15" : "#ff3366",
    });
  }

  // 3D Wireframe Icosahedron Geometry
  const phi = (1 + Math.sqrt(5)) / 2;
  const rawVertices = [
    [-1, phi, 0],
    [1, phi, 0],
    [-1, -phi, 0],
    [1, -phi, 0],
    [0, -1, phi],
    [0, 1, phi],
    [0, -1, -phi],
    [0, 1, -phi],
    [phi, 0, -1],
    [phi, 0, 1],
    [-phi, 0, -1],
    [-phi, 0, 1],
  ];
  const scale = 140;
  const vertices = rawVertices.map((v) => {
    const len = Math.hypot(...v);
    return [(v[0] / len) * scale, (v[1] / len) * scale, (v[2] / len) * scale];
  });

  const edges = [
    [0, 11],
    [0, 5],
    [0, 1],
    [0, 7],
    [0, 10],
    [1, 5],
    [1, 7],
    [1, 8],
    [1, 9],
    [2, 10],
    [2, 11],
    [2, 4],
    [2, 6],
    [2, 3],
    [3, 4],
    [3, 6],
    [3, 8],
    [3, 9],
    [4, 5],
    [4, 9],
    [4, 11],
    [5, 9],
    [5, 11],
    [6, 7],
    [6, 8],
    [6, 10],
    [7, 8],
    [7, 10],
    [8, 9],
    [10, 11],
  ];

  let icoAngleX = 0;
  let icoAngleY = 0;
  let icoAngleZ = 0;

  const focalLength = 650;

  function render() {
    ctx.clearRect(0, 0, width, height);

    curRotX += (targetRotX - curRotX) * 0.05;
    curRotY += (targetRotY - curRotY) * 0.05;

    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    const primaryColor = isLight ? "#d97706" : "#facc15";
    const lineColor = isLight
      ? "rgba(217, 119, 6, 0.12)"
      : "rgba(250, 204, 21, 0.14)";

    // Update & draw particles
    const projected = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      if (p.x < -800) p.x = 800;
      if (p.x > 800) p.x = -800;
      if (p.y < -600) p.y = 600;
      if (p.y > 600) p.y = -600;
      if (p.z < 100) p.z = 1100;
      if (p.z > 1100) p.z = 100;

      const cosY = Math.cos(curRotY);
      const sinY = Math.sin(curRotY);
      const cosX = Math.cos(curRotX);
      const sinX = Math.sin(curRotX);

      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;
      const y1 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX + 350;

      const f = focalLength / (focalLength + z2);
      const sx = width / 2 + x1 * f;
      const sy = height / 2 + y1 * f;

      projected.push({ sx, sy, f, color: p.color, size: p.size });

      if (f > 0) {
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * f, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, Math.max(0.1, f * 0.8));
        ctx.fill();
      }
    }

    // Connect close particles with 3D constellation lines
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const dx = projected[i].sx - projected[j].sx;
        const dy = projected[i].sy - projected[j].sy;
        const dist = Math.hypot(dx, dy);
        if (dist < 110) {
          ctx.globalAlpha = (1 - dist / 110) * 0.22;
          ctx.beginPath();
          ctx.moveTo(projected[i].sx, projected[i].sy);
          ctx.lineTo(projected[j].sx, projected[j].sy);
          ctx.stroke();
        }
      }
    }

    // Render 3D Rotating Icosahedron behind Hero Section
    icoAngleX += 0.004;
    icoAngleY += 0.007;
    icoAngleZ += 0.002;

    const totalRotX = icoAngleX + curRotX * 0.8;
    const totalRotY = icoAngleY + curRotY * 0.8;
    const totalRotZ = icoAngleZ;

    const centerX = width * 0.5;
    const centerY = Math.min(height * 0.35, 340);
    const icoZOffset = 450;

    const rotVerts = vertices.map(([x, y, z]) => {
      let x1 = x * Math.cos(totalRotY) + z * Math.sin(totalRotY);
      let z1 = -x * Math.sin(totalRotY) + z * Math.cos(totalRotY);
      let y1 = y * Math.cos(totalRotX) - z1 * Math.sin(totalRotX);
      let z2 = y * Math.sin(totalRotX) + z1 * Math.cos(totalRotX);
      let x2 = x1 * Math.cos(totalRotZ) - y1 * Math.sin(totalRotZ);
      let y2 = x1 * Math.sin(totalRotZ) + y1 * Math.cos(totalRotZ);

      const f = focalLength / (focalLength + z2 + icoZOffset);
      return {
        x: centerX + x2 * f,
        y: centerY + y2 * f,
        f,
        z: z2,
      };
    });

    // Draw Icosahedron Edges with depth styling
    edges.forEach(([i, j]) => {
      const v1 = rotVerts[i];
      const v2 = rotVerts[j];
      const avgZ = (v1.z + v2.z) / 2;
      const alpha = Math.max(0.1, Math.min(0.65, (avgZ + 150) / 300));

      ctx.beginPath();
      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
      ctx.strokeStyle = primaryColor;
      ctx.globalAlpha = alpha * 0.7;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });

    // Draw Icosahedron Vertices
    rotVerts.forEach((v) => {
      ctx.beginPath();
      ctx.arc(v.x, v.y, 3 * v.f, 0, Math.PI * 2);
      ctx.fillStyle = primaryColor;
      ctx.globalAlpha = Math.max(0.2, v.f);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

/* ==========================================================================
   7. 3D CARD TILT & SPECULAR GLARE REFLECTION ENGINE
   ========================================================================== */
function init3DTilt() {
  const tiltElements = document.querySelectorAll("[data-tilt]");

  tiltElements.forEach((el) => {
    // Add glare overlay layer if not already present
    if (!el.querySelector(".glare-overlay")) {
      const glare = document.createElement("div");
      glare.className = "glare-overlay";
      el.appendChild(glare);
    }

    let isHovering = false;

    el.addEventListener("mouseenter", () => {
      isHovering = true;
      if (el.classList.contains("is-floating")) {
        el.style.animationPlayState = "paused";
      }
    });

    el.addEventListener("mousemove", (e) => {
      if (!isHovering) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normX = (x / rect.width - 0.5) * 2;
      const normY = (y / rect.height - 0.5) * 2;

      const maxDeg = parseFloat(el.getAttribute("data-tilt-max")) || 10;
      const rotX = -normY * maxDeg;
      const rotY = normX * maxDeg;

      el.style.setProperty("--glare-x", `${x}px`);
      el.style.setProperty("--glare-y", `${y}px`);

      el.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;
    });

    el.addEventListener("mouseleave", () => {
      isHovering = false;
      el.style.transform = "";
      if (el.classList.contains("is-floating")) {
        el.style.animationPlayState = "running";
      }
    });
  });
}

/* ==========================================================================
   8. ANIMATED COUNTER METRICS
   ========================================================================== */
function initCounters() {
  const counters = document.querySelectorAll(".counter-val");
  if (!counters.length) return;

  let triggered = false;

  function runCounters() {
    if (triggered) return;
    const heroMetrics = document.querySelector(".hero-metrics-grid");
    if (!heroMetrics) return;

    const rect = heroMetrics.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      triggered = true;

      counters.forEach((counter) => {
        const target = parseFloat(counter.getAttribute("data-target")) || 0;
        const isDecimal = target % 1 !== 0;
        const duration = 1600;
        const startTime = performance.now();

        function updateCount(time) {
          const elapsed = time - startTime;
          const progress = Math.min(1, elapsed / duration);
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const current = target * ease;

          counter.textContent = isDecimal
            ? current.toFixed(1)
            : Math.round(current);

          if (progress < 1) {
            requestAnimationFrame(updateCount);
          } else {
            counter.textContent = isDecimal ? target.toFixed(1) : target;
          }
        }

        requestAnimationFrame(updateCount);
      });
    }
  }

  window.addEventListener("scroll", runCounters, { passive: true });
  runCounters();
}


/* ==========================================================================
   MOBILE NAVIGATION MENU TOGGLE & SMOOTH AUTO-CLOSE
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById("mobileMenuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!toggleBtn || !navLinks) return;

  function closeMenu() {
    navLinks.classList.remove("is-open");
    toggleBtn.classList.remove("is-active");
    toggleBtn.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    navLinks.classList.add("is-open");
    toggleBtn.classList.add("is-active");
    toggleBtn.setAttribute("aria-expanded", "true");
  }

  function handleToggle(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (navLinks.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  toggleBtn.onclick = handleToggle;

  navLinks.querySelectorAll("a").forEach(function(link) {
    function handleNavClick(e) {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const targetId = href.substring(1);
      const target = document.getElementById(targetId);

      // Always close menu
      closeMenu();

      if (target) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        try {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (err) {
          const header = document.querySelector(".header");
          const headerH = header ? header.offsetHeight : 56;
          const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
          const targetRect = target.getBoundingClientRect();
          const targetY = Math.max(0, targetRect.top + currentScrollY - headerH - 12);
          window.scrollTo({
            top: targetY,
            behavior: "smooth"
          });
        }

        if (window.history && window.history.pushState) {
          window.history.pushState(null, "", href);
        }
      }
    }

    link.onclick = handleNavClick;
  });

  document.addEventListener("click", function(e) {
    if (navLinks.classList.contains("is-open") &&
        !toggleBtn.contains(e.target) &&
        !navLinks.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && navLinks.classList.contains("is-open")) {
      closeMenu();
    }
  });
}

// Safety execution

/* ==========================================================================
   DIRECT GOOGLE MAIL (GMAIL) COMPOSER INTEGRATION
   ========================================================================== */
function initMailLinks() {
  const mailLinks = document.querySelectorAll('a[href*="mail.google.com"], a[href^="mailto:"]');
  const gmailUrl = "https://mail.google.com/mail/?view=cm&fs=1&to=adeelu001@gmail.com";
  mailLinks.forEach((link) => {
    link.setAttribute("href", gmailUrl);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    link.onclick = function(e) {
      // Ensure smooth popup / new tab open
      window.open(gmailUrl, "_blank", "noopener,noreferrer");
      if (e) e.preventDefault();
    };
  });
}

if (!isInitialized) {
  initAll();
}
