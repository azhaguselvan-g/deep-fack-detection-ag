const modeConfig = {
  image: {
    accept: "image/*",
    dropTitle: "Drop an image to start",
    dropHint: "Supports JPG, PNG, WEBP, and HEIC demo previews with drag-and-drop or tap upload.",
    previewTitle: "Your uploaded image will appear here",
    previewHint: "Drop content into the upload panel to activate instant image preview.",
    previewMode: "Image detection",
    badge: "IMAGE",
    metrics: ["Pixel consistency", "Lighting integrity", "Facial geometry"],
  },
  video: {
    accept: "video/*",
    dropTitle: "Drop a video to start",
    dropHint: "Supports MP4, MOV, WEBM, and M4V demo previews with drag-and-drop or tap upload.",
    previewTitle: "Your uploaded video will appear here",
    previewHint: "Drop content into the upload panel to activate instant video playback preview.",
    previewMode: "Video detection",
    badge: "VIDEO",
    metrics: ["Temporal coherence", "Lip sync match", "Frame continuity"],
  },
};

const authModeConfig = {
  signin: {
    title: "Welcome back",
    description: "Sign in to access your detection workspace, saved previews, and scan history.",
    submitLabel: "Login",
    note: "Demo authentication UI only. No backend is connected.",
    passwordPlaceholder: "Enter your password",
    passwordAutocomplete: "current-password",
  },
  signup: {
    title: "Create your account",
    description: "Sign up to unlock secure scan history, premium dashboards, and collaboration workflows.",
    submitLabel: "Create account",
    note: "Demo sign-up UI only. Account creation is not connected yet.",
    passwordPlaceholder: "Create a password",
    passwordAutocomplete: "new-password",
  },
};

const state = {
  mode: "image",
  file: null,
  objectUrl: null,
  dragDepth: 0,
  analysisTimer: null,
  isMenuOpen: false,
  isModalOpen: false,
  authMode: "signin",
  lastAuthTrigger: null,
};

const body = document.body;
const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const dropzoneTitle = document.getElementById("dropzoneTitle");
const dropzoneHint = document.getElementById("dropzoneHint");
const previewTitle = document.getElementById("previewTitle");
const previewHint = document.getElementById("previewHint");
const previewModeBadge = document.getElementById("previewModeBadge");
const resultModeBadge = document.getElementById("resultModeBadge");
const previewModeText = document.getElementById("previewModeText");
const previewFileName = document.getElementById("previewFileName");
const previewEmpty = document.getElementById("previewEmpty");
const imagePreview = document.getElementById("imagePreview");
const videoPreview = document.getElementById("videoPreview");
const fileMeta = document.getElementById("fileMeta");
const analyzeButton = document.getElementById("analyzeButton");
const clearButton = document.getElementById("clearButton");
const resultEmpty = document.getElementById("resultEmpty");
const loadingState = document.getElementById("loadingState");
const resultCard = document.getElementById("resultCard");
const statusPill = document.getElementById("statusPill");
const confidenceText = document.getElementById("confidenceText");
const progressValue = document.getElementById("progressValue");
const progressBar = document.getElementById("progressBar");
const resultSummary = document.getElementById("resultSummary");
const navToggle = document.getElementById("navToggle");
const mobileMenuWrap = document.getElementById("mobileMenuWrap");
const authModal = document.getElementById("authModal");
const authClose = document.getElementById("authClose");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authSubmit = document.getElementById("authSubmit");
const authNote = document.getElementById("authNote");
const authForm = document.getElementById("authForm");
const authPassword = document.getElementById("authPassword");
const authIdentity = document.getElementById("authIdentity");

const metricNodes = [
  {
    label: document.getElementById("metricOneLabel"),
    value: document.getElementById("metricOneValue"),
  },
  {
    label: document.getElementById("metricTwoLabel"),
    value: document.getElementById("metricTwoValue"),
  },
  {
    label: document.getElementById("metricThreeLabel"),
    value: document.getElementById("metricThreeValue"),
  },
];

function init() {
  createParticles();
  initRevealObserver();
  initRipples();
  bindDetectionTabs();
  bindUploads();
  bindActions();
  bindNavigation();
  bindAuth();
  syncModeUI();
  syncMobileMenu();
  syncAuthMode();
}

function createParticles() {
  const particleField = document.getElementById("particleField");

  for (let index = 0; index < 26; index += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.setProperty("--size", `${randomBetween(6, 18)}px`);
    particle.style.setProperty("--left", `${Math.random() * 100}%`);
    particle.style.setProperty("--top", `${Math.random() * 100}%`);
    particle.style.setProperty("--duration", `${randomBetween(8, 18)}s`);
    particle.style.setProperty("--delay", `${Math.random() * 8}s`);
    particleField.appendChild(particle);
  }
}

function initRevealObserver() {
  const revealItems = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function initRipples() {
  document.querySelectorAll(".ripple-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 700);
    });
  });
}

function bindDetectionTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      const nextMode = button.dataset.mode;

      if (!nextMode || nextMode === state.mode) {
        return;
      }

      state.mode = nextMode;
      syncModeUI();
      resetMediaState();
    });
  });
}

function bindUploads() {
  fileInput.addEventListener("change", (event) => {
    if (event.target.files?.length) {
      handleFile(event.target.files[0]);
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      state.dragDepth += 1;
      dropzone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      state.dragDepth = Math.max(0, state.dragDepth - 1);

      if (state.dragDepth === 0 || eventName === "drop") {
        dropzone.classList.remove("is-dragging");
        state.dragDepth = 0;
      }
    });
  });

  dropzone.addEventListener("drop", (event) => {
    const droppedFile = event.dataTransfer?.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  });
}

function bindActions() {
  analyzeButton.addEventListener("click", startDemoAnalysis);
  clearButton.addEventListener("click", resetMediaState);
}

function bindNavigation() {
  navToggle.addEventListener("click", () => {
    state.isMenuOpen = !state.isMenuOpen;
    syncMobileMenu();
  });

  document.querySelectorAll(".mobile-nav-links a, .mobile-menu-actions a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768 && state.isMenuOpen) {
      closeMobileMenu();
    }
  });
}

function bindAuth() {
  document.querySelectorAll(".auth-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      openAuthModal(button.dataset.authMode || "signin");
    });
  });

  document.querySelectorAll(".auth-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.authMode = button.dataset.authMode || "signin";
      syncAuthMode();
    });
  });

  authClose.addEventListener("click", closeAuthModal);

  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });

  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    authNote.textContent = "This authentication flow is a polished front-end demo only.";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.isModalOpen) {
        closeAuthModal();
      } else if (state.isMenuOpen) {
        closeMobileMenu();
      }
    }
  });
}

function syncModeUI() {
  const config = modeConfig[state.mode];

  fileInput.accept = config.accept;
  dropzoneTitle.textContent = config.dropTitle;
  dropzoneHint.textContent = config.dropHint;
  previewTitle.textContent = config.previewTitle;
  previewHint.textContent = config.previewHint;
  previewModeText.textContent = config.previewMode;
  previewModeBadge.textContent = config.badge;
  resultModeBadge.textContent = config.badge;

  metricNodes.forEach((node, index) => {
    node.label.textContent = config.metrics[index];
    node.value.textContent = "--";
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function syncMobileMenu() {
  navToggle.classList.toggle("is-open", state.isMenuOpen);
  navToggle.setAttribute("aria-expanded", String(state.isMenuOpen));
  navToggle.setAttribute("aria-label", state.isMenuOpen ? "Close navigation menu" : "Open navigation menu");
  mobileMenuWrap.classList.toggle("is-open", state.isMenuOpen);
  mobileMenuWrap.setAttribute("aria-hidden", String(!state.isMenuOpen));
}

function closeMobileMenu() {
  if (!state.isMenuOpen) {
    return;
  }

  state.isMenuOpen = false;
  syncMobileMenu();
}

function syncAuthMode() {
  const config = authModeConfig[state.authMode];

  authTitle.textContent = config.title;
  authDescription.textContent = config.description;
  authSubmit.textContent = config.submitLabel;
  authNote.textContent = config.note;
  authPassword.placeholder = config.passwordPlaceholder;
  authPassword.setAttribute("autocomplete", config.passwordAutocomplete);

  document.querySelectorAll(".auth-tab").forEach((button) => {
    const isActive = button.dataset.authMode === state.authMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function openAuthModal(mode = "signin") {
  closeMobileMenu();
  state.authMode = mode;
  state.isModalOpen = true;
  state.lastAuthTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  syncAuthMode();
  authForm.reset();
  authModal.classList.add("is-open");
  authModal.setAttribute("aria-hidden", "false");
  body.classList.add("is-modal-open");

  window.setTimeout(() => {
    authIdentity.focus();
  }, 120);
}

function closeAuthModal() {
  if (!state.isModalOpen) {
    return;
  }

  state.isModalOpen = false;
  authModal.classList.remove("is-open");
  authModal.setAttribute("aria-hidden", "true");
  body.classList.remove("is-modal-open");

  if (state.lastAuthTrigger) {
    state.lastAuthTrigger.focus();
    state.lastAuthTrigger = null;
  }
}

function handleFile(file) {
  const expectedType = state.mode === "image" ? "image/" : "video/";

  if (!file.type.startsWith(expectedType)) {
    fileMeta.textContent = `Please choose a ${state.mode} file for ${modeConfig[state.mode].previewMode.toLowerCase()}.`;
    dropzone.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 280, easing: "ease-out" }
    );
    return;
  }

  revokeObjectUrl();
  state.file = file;
  state.objectUrl = URL.createObjectURL(file);

  previewEmpty.hidden = true;
  previewFileName.textContent = file.name;
  fileMeta.textContent = `${file.name} | ${formatFileSize(file.size)}`;
  analyzeButton.disabled = false;
  clearButton.disabled = false;
  dropzone.classList.add("has-file");
  analyzeButton.textContent = "Re-run Demo Scan";

  if (state.mode === "image") {
    videoPreview.pause();
    videoPreview.removeAttribute("src");
    videoPreview.hidden = true;
    imagePreview.src = state.objectUrl;
    imagePreview.hidden = false;
  } else {
    imagePreview.removeAttribute("src");
    imagePreview.hidden = true;
    videoPreview.src = state.objectUrl;
    videoPreview.hidden = false;
    videoPreview.load();
  }

  startDemoAnalysis();
}

function startDemoAnalysis() {
  if (!state.file) {
    return;
  }

  window.clearTimeout(state.analysisTimer);
  resultEmpty.hidden = true;
  resultCard.hidden = true;
  loadingState.hidden = false;
  progressBar.style.width = "0%";

  state.analysisTimer = window.setTimeout(() => {
    renderResult(generateMockResult());
  }, 1700);
}

function generateMockResult() {
  const fakeProbability = state.mode === "video" ? 0.62 : 0.48;
  const isFake = Math.random() < fakeProbability;
  const confidence = isFake ? randomBetween(82, 98) : randomBetween(68, 95);
  const status = isFake ? "Fake" : "Real";
  const summary = isFake
    ? `Potential manipulation cues detected in ${state.file.name}. The model found anomalies across ${
        state.mode === "video" ? "frame continuity and lip synchronization" : "lighting and facial structure"
      }.`
    : `No dominant manipulation signals were surfaced in ${state.file.name}. The media appears consistent across ${
        state.mode === "video" ? "temporal motion, cadence, and scene continuity" : "pixel structure, lighting, and geometry"
      }.`;

  const metrics =
    state.mode === "video"
      ? [
          `${randomBetween(72, 97)}%`,
          `${randomBetween(69, 96)}%`,
          `${randomBetween(70, 98)}%`,
        ]
      : [
          `${randomBetween(73, 99)}%`,
          `${randomBetween(67, 95)}%`,
          `${randomBetween(74, 99)}%`,
        ];

  return { status, confidence, summary, metrics };
}

function renderResult(result) {
  loadingState.hidden = true;
  resultCard.hidden = false;
  resultCard.classList.remove("is-ready");

  statusPill.textContent = result.status;
  statusPill.classList.toggle("is-fake", result.status === "Fake");
  confidenceText.textContent = `${result.confidence}% confidence`;
  progressValue.textContent = `${result.confidence}%`;
  resultSummary.textContent = result.summary;

  progressBar.style.background =
    result.status === "Fake"
      ? "linear-gradient(90deg, rgba(255, 125, 145, 0.95), rgba(255, 198, 118, 0.95))"
      : "linear-gradient(90deg, rgba(129, 255, 203, 0.95), rgba(123, 247, 255, 0.95), rgba(61, 137, 255, 0.95))";

  metricNodes.forEach((node, index) => {
    node.label.textContent = modeConfig[state.mode].metrics[index];
    node.value.textContent = result.metrics[index];
  });

  requestAnimationFrame(() => {
    resultCard.classList.add("is-ready");
    window.setTimeout(() => {
      progressBar.style.width = `${result.confidence}%`;
    }, 90);
  });
}

function resetMediaState() {
  window.clearTimeout(state.analysisTimer);
  state.file = null;
  revokeObjectUrl();
  fileInput.value = "";
  fileMeta.textContent = "No media selected yet.";
  previewFileName.textContent = "Awaiting upload";
  analyzeButton.textContent = "Run Demo Scan";
  analyzeButton.disabled = true;
  clearButton.disabled = true;
  dropzone.classList.remove("has-file", "is-dragging");
  previewEmpty.hidden = false;
  imagePreview.hidden = true;
  videoPreview.hidden = true;
  imagePreview.removeAttribute("src");
  videoPreview.pause();
  videoPreview.removeAttribute("src");
  resultEmpty.hidden = false;
  loadingState.hidden = true;
  resultCard.hidden = true;
  resultCard.classList.remove("is-ready");
  progressBar.style.width = "0%";
  progressValue.textContent = "0%";
  confidenceText.textContent = "0% confidence";
  statusPill.textContent = "Real";
  statusPill.classList.remove("is-fake");
  resultSummary.textContent = "Upload media to generate a dummy result narrative.";
  syncModeUI();
}

function revokeObjectUrl() {
  if (state.objectUrl) {
    URL.revokeObjectURL(state.objectUrl);
    state.objectUrl = null;
  }
}

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

window.addEventListener("beforeunload", revokeObjectUrl);
window.addEventListener("DOMContentLoaded", init);
