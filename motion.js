// Cursor-reactive motion: hero orb follow + magnetic buttons/nav links.
// Pointer/hover devices only, and only when the user hasn't asked for reduced motion.
(function () {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!canHover || reducedMotion) return;

  const styles = getComputedStyle(document.documentElement);
  const px = (name, fallback) => parseFloat(styles.getPropertyValue(name)) || fallback;

  // --- Hero orb cursor-follow (index.html only) ---
  const hero = document.querySelector(".hero");
  const sphere = document.querySelector(".sphere");

  if (hero && sphere) {
    const followDistance = px("--orb-follow-distance", 14);
    const followLerp = px("--orb-follow-lerp", 0.08);

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    hero.addEventListener("pointermove", (e) => {
      const rect = hero.getBoundingClientRect();
      const fx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1..1
      const fy = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetX = Math.max(-1, Math.min(1, fx)) * followDistance;
      targetY = Math.max(-1, Math.min(1, fy)) * followDistance;
    });

    hero.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
    });

    function tickOrb() {
      currentX += (targetX - currentX) * followLerp;
      currentY += (targetY - currentY) * followLerp;
      sphere.style.setProperty("--orb-x", currentX.toFixed(2) + "px");
      sphere.style.setProperty("--orb-y", currentY.toFixed(2) + "px");
      requestAnimationFrame(tickOrb);
    }
    requestAnimationFrame(tickOrb);
  }

  // --- Magnetic ghost-links / nav links (site-wide) ---
  const magneticEls = Array.from(document.querySelectorAll(".ghost-link, nav a"));

  if (magneticEls.length) {
    const radius = px("--magnetic-radius", 70);
    const strength = px("--magnetic-strength", 0.3);

    let pointerX = -Infinity;
    let pointerY = -Infinity;
    let queued = false;

    function applyMagnetism() {
      queued = false;
      magneticEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = pointerX - cx;
        const dy = pointerY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < radius) {
          const pull = (1 - dist / radius) * strength;
          el.style.removeProperty("--magnetic-transform-duration");
          el.style.removeProperty("--magnetic-transform-ease");
          el.style.transform = `translate(${(dx * pull).toFixed(2)}px, ${(dy * pull).toFixed(2)}px)`;
          el.dataset.magneticActive = "true";
        } else if (el.dataset.magneticActive) {
          el.style.setProperty("--magnetic-transform-duration", "var(--duration-base)");
          el.style.setProperty("--magnetic-transform-ease", "var(--ease-spring)");
          el.style.transform = "";
          delete el.dataset.magneticActive;
        }
      });
    }

    window.addEventListener("pointermove", (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!queued) {
        queued = true;
        requestAnimationFrame(applyMagnetism);
      }
    });

    window.addEventListener("pointerleave", () => {
      pointerX = -Infinity;
      pointerY = -Infinity;
      if (!queued) {
        queued = true;
        requestAnimationFrame(applyMagnetism);
      }
    });
  }
})();
