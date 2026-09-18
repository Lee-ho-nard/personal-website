// Cursor-reactive + scroll-linked motion: orb follow, magnetic buttons/nav
// links, and the Home-only scroll-linked orb. Each effect is gated
// independently — scroll-linking only needs reduced-motion off; cursor
// effects also need a real pointer.
(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const styles = getComputedStyle(document.documentElement);
  const px = (name, fallback) => parseFloat(styles.getPropertyValue(name)) || fallback;

  // --- Orb cursor-follow (every page — whichever .orb-frame/.sphere exists) ---
  if (canHover && !reducedMotion) {
    const frame = document.querySelector(".orb-frame");
    const sphere = frame ? frame.querySelector(".sphere") : null;

    if (frame && sphere) {
      const followDistance = px("--orb-follow-distance", 14);
      const followLerp = px("--orb-follow-lerp", 0.08);

      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      frame.addEventListener("pointermove", (e) => {
        const rect = frame.getBoundingClientRect();
        const fx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1..1
        const fy = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        targetX = Math.max(-1, Math.min(1, fx)) * followDistance;
        targetY = Math.max(-1, Math.min(1, fy)) * followDistance;
      });

      frame.addEventListener("pointerleave", () => {
        targetX = 0;
        targetY = 0;
      });

      (function tickOrb() {
        currentX += (targetX - currentX) * followLerp;
        currentY += (targetY - currentY) * followLerp;
        sphere.style.setProperty("--orb-x", currentX.toFixed(2) + "px");
        sphere.style.setProperty("--orb-y", currentY.toFixed(2) + "px");
        requestAnimationFrame(tickOrb);
      })();
    }
  }

  // --- Magnetic ghost-links / nav links (site-wide, pointer devices only) ---
  if (canHover && !reducedMotion) {
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
  }

  // --- Scroll-linked hero orb persistence (Home only) ---
  if (!reducedMotion) {
    const hero = document.querySelector(".hero");
    const heroSphere = hero ? hero.querySelector(".sphere") : null;
    const footer = document.querySelector("footer");

    // h2 and p are block boxes sized to their container/max-width, not to
    // their actual glyphs — a short "NOW" heading and a wrapped paragraph
    // both report a bounding-box edge far past where the visible text
    // really ends, especially once a line wraps well short of its
    // max-width. Range.getClientRects() gives the real per-line text
    // extent instead, so "open space" means genuinely empty pixels.
    const proseEls = Array.from(document.querySelectorAll("#now h2, #now p, #now .ghost-link, #contact h2, #contact p, #contact .ghost-link"));

    if (hero && heroSphere && footer) {
      let scrollQueued = false;

      function measuredRight(el) {
        if (el.tagName === "H2" || el.tagName === "P") {
          const range = document.createRange();
          range.selectNodeContents(el);
          let maxRight = 0;
          for (const rect of range.getClientRects()) maxRight = Math.max(maxRight, rect.right);
          return maxRight;
        }
        return el.getBoundingClientRect().right;
      }

      // How far the orb can roam left before it would reach the prose text,
      // measured against the actual rendered text edge (not an assumed
      // fraction of viewport width) so it's real open space at any size.
      function measureRoamAmplitude() {
        if (!proseEls.length) return 0;
        const textRight = Math.max(...proseEls.map(measuredRight));
        const margin = 40;
        return Math.max(60, Math.min(260, window.innerWidth - textRight - margin));
      }

      function updateScrollOrb() {
        scrollQueued = false;
        const heroHeight = hero.offsetHeight || 1;
        const scrollY = window.scrollY;
        const progress = Math.min(1, Math.max(0, scrollY / heroHeight));
        const scale = 1 - progress * 0.35; // recede as you scroll past the hero
        const drift = -progress * 40; // px, drifts up slightly toward its resting slot

        // Now/Contact have no card box to dodge (see #now/#contact in
        // style.css), so the whole right-hand two-thirds of the page is
        // open — let the orb actually roam through it rather than sitting
        // pinned to one spot. A sine arc over the *whole* page's scroll
        // progress (not just the hero-exit blend) drifts it left into that
        // open space around the midpoint of the page and back toward its
        // resting spot by the time the footer arrives.
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const pageProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
        const roamAmplitude = measureRoamAmplitude();
        const roamX = -Math.sin(pageProgress * Math.PI) * roamAmplitude;

        const footerTop = footer.getBoundingClientRect().top + scrollY;
        const fadeStart = footerTop - window.innerHeight * 1.2;
        const fadeEnd = footerTop - window.innerHeight * 0.4;
        const fadeRange = Math.max(1, fadeEnd - fadeStart);
        const fadeProgress = Math.min(1, Math.max(0, (scrollY - fadeStart) / fadeRange));

        heroSphere.style.setProperty("--scroll-scale", scale.toFixed(3));
        heroSphere.style.setProperty("--scroll-y", drift.toFixed(1) + "px");
        heroSphere.style.setProperty("--scroll-x", roamX.toFixed(1) + "px");
        heroSphere.style.setProperty("--scroll-opacity", (1 - fadeProgress).toFixed(3));
      }

      function queueScrollUpdate() {
        if (!scrollQueued) {
          scrollQueued = true;
          requestAnimationFrame(updateScrollOrb);
        }
      }

      window.addEventListener("scroll", queueScrollUpdate, { passive: true });
      window.addEventListener("resize", queueScrollUpdate, { passive: true });

      updateScrollOrb();
    }
  }
})();
