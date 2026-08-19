const scroller = document.getElementById("cardScroll");
const slides = [...document.querySelectorAll(".slide")];
const currentTitle = document.getElementById("currentTitle");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const navDotsContainer = document.getElementById("navDots");
const introLoader = document.getElementById("introLoader");

let current = 0;
let pointerDown = false;
let startX = 0;
let startScroll = 0;
let scrollTimer;
let wheelLock = false;

/* ── Navigation dots ── */
const dots = [];
slides.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.className = "nav-dot" + (i === 0 ? " active" : "");
  dot.setAttribute("aria-label", `Go to card ${i + 1}`);
  dot.addEventListener("click", () => goTo(i));
  navDotsContainer.appendChild(dot);
  dots.push(dot);
});

function updateUI() {
  const activeSlide = slides[current];

  currentTitle.textContent = activeSlide.dataset.title.toUpperCase();

  // Sync navigation dots
  dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
}

function goTo(index, behavior = "smooth") {
  current = (index + slides.length) % slides.length;

  slides[current].scrollIntoView({
    behavior,
    block: "nearest",
    inline: "center"
  });

  updateUI();
}

function syncCurrent() {
  const center = scroller.scrollLeft + scroller.clientWidth / 2;
  let closest = 0;
  let distance = Infinity;

  slides.forEach((slide, index) => {
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const delta = Math.abs(slideCenter - center);

    if (delta < distance) {
      distance = delta;
      closest = index;
    }
  });

  if (current !== closest) {
    current = closest;
    updateUI();
  }
}

prevBtn.addEventListener("click", () => goTo(current - 1));
nextBtn.addEventListener("click", () => goTo(current + 1));

document.querySelectorAll("[data-go]").forEach((element) => {
  element.addEventListener("click", (event) => {
    event.preventDefault();
    goTo(Number(element.dataset.go));
  });
});

window.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;

  if (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key)) {
    event.preventDefault();
    goTo(current + 1);
  } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    goTo(current - 1);
  } else if (event.key === "Home") {
    event.preventDefault();
    goTo(0);
  } else if (event.key === "End") {
    event.preventDefault();
    goTo(slides.length - 1);
  }
});

scroller.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse") return;
  if (event.target.closest("a, button")) return;

  pointerDown = true;
  startX = event.clientX;
  startScroll = scroller.scrollLeft;
  scroller.setPointerCapture?.(event.pointerId);
});

scroller.addEventListener("pointermove", (event) => {
  if (!pointerDown) return;
  scroller.scrollLeft = startScroll - (event.clientX - startX);
});

function finishPointer(event) {
  if (!pointerDown) return;

  pointerDown = false;
  const distance = event.clientX - startX;

  if (Math.abs(distance) > 55) {
    goTo(current + (distance < 0 ? 1 : -1));
  } else {
    syncCurrent();
  }
}

scroller.addEventListener("pointerup", finishPointer);
scroller.addEventListener("pointercancel", finishPointer);

scroller.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

  event.preventDefault();
  if (wheelLock) return;

  wheelLock = true;
  goTo(current + (event.deltaY > 0 ? 1 : -1));
  window.setTimeout(() => { wheelLock = false; }, 650);
}, { passive: false });

let isScrolling = false;
scroller.addEventListener("scroll", () => {
  if (!isScrolling) {
    window.requestAnimationFrame(() => {
      syncCurrent();
      isScrolling = false;
    });
    isScrolling = true;
  }
});

slides.forEach((slide) => {
  const card = slide.querySelector(".card");
  if (!card) return;

  slide.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(max-width: 800px)").matches || pointerDown) return;

    const rect = slide.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    const isActive = Math.abs(slide.offsetLeft - scroller.scrollLeft) < scroller.clientWidth * .45;

    if (!isActive) return;

    card.style.transform = `rotateX(${7 - y * 4}deg) rotateY(${-7 + x * 7}deg) rotateZ(${-1 + x * 1.4}deg) translateY(${-y * 5}px)`;
  });

  slide.addEventListener("pointerleave", () => { card.style.transform = ""; });
});

/* ── Ambient floating particles ── */
(function spawnParticles() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const scene = document.querySelector(".scene");
  const count = 15;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";

    const size = 2 + Math.random() * 3;
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const duration = 10 + Math.random() * 14;
    const drift = -40 + Math.random() * 80;
    const opacity = .08 + Math.random() * .18;

    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${left}%;
      bottom: -10px;
      --p-drift: ${drift}px;
      --p-opacity: ${opacity};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;

    scene.appendChild(p);
  }
})();

/* ── Intro loader ── */
(function handleIntro() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced || !introLoader) {
    introLoader?.classList.add("done");
    updateUI();
    return;
  }

  // Dismiss loader after the bar animation completes (~1.8s total)
  window.setTimeout(() => {
    introLoader.classList.add("done");
  }, 1800);
})();

window.addEventListener("resize", syncCurrent);
updateUI();

/* ── Ambient Cursor Glow ── */
const cursorGlow = document.createElement('div');
cursorGlow.className = 'cursor-glow';
document.body.appendChild(cursorGlow);

document.addEventListener('mousemove', (e) => {
  cursorGlow.style.opacity = 1;
  cursorGlow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
});

document.addEventListener('mouseleave', () => {
  cursorGlow.style.opacity = 0;
});
