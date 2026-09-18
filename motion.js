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

    const card = document.querySelector("section");

    if (hero && heroSphere && footer && card) {
      let scrollQueued = false;
      const restRightInset = 35; // matches .hero .sphere's base `right` value

      function updateScrollOrb() {
        scrollQueued = false;
        const heroHeight = hero.offsetHeight || 1;
        const scrollY = window.scrollY;
        const progress = Math.min(1, Math.max(0, scrollY / heroHeight));
        const scale = 1 - progress * 0.35; // recede as you scroll past the hero
        const drift = -progress * 40; // px, drifts up slightly toward its resting slot

        // Blended in over the last 40% of the hero scroll: measure the
        // actual card edge and push the orb right by exactly however much
        // is needed to clear it, so it can never overlap a card regardless
        // of viewport width — a measured guarantee, not an assumed margin.
        //
        // `scale()` shrinks the box around its own transform-origin (the
        // center of its *unscaled* layout box), so the post-scale edge has
        // to be derived from the unscaled center, not from naively
        // subtracting the already-scaled width from the unscaled edge.
        const capBlend = Math.max(0, Math.min(1, (progress - 0.6) / 0.4));
        let pushX = 0;
        if (capBlend > 0) {
          const baseWidth = Math.min(320, window.innerWidth * 0.55);
          const naturalCenterX = window.innerWidth - restRightInset - baseWidth / 2;
          const orbWidth = baseWidth * scale;
          const safetyBuffer = 24;
          const targetLeftEdge = card.getBoundingClientRect().right + safetyBuffer;
          const neededPush = targetLeftEdge - (naturalCenterX - orbWidth / 2);
          pushX = Math.max(0, neededPush) * capBlend;
        }

        const footerTop = footer.getBoundingClientRect().top + scrollY;
        const fadeStart = footerTop - window.innerHeight * 1.2;
        const fadeEnd = footerTop - window.innerHeight * 0.4;
        const fadeRange = Math.max(1, fadeEnd - fadeStart);
        const fadeProgress = Math.min(1, Math.max(0, (scrollY - fadeStart) / fadeRange));

        heroSphere.style.setProperty("--scroll-scale", scale.toFixed(3));
        heroSphere.style.setProperty("--scroll-y", drift.toFixed(1) + "px");
        heroSphere.style.setProperty("--scroll-x", pushX.toFixed(1) + "px");
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

  // --- Directional page-swap tagging (View Transition Types API) ---
  window.addEventListener("pageswap", (event) => {
    if (!event.viewTransition || !event.activation) return;

    const navOrder = ["index.html", "work.html", "about.html", "life.html"];
    const pageName = (url) => {
      try {
        const file = new URL(url).pathname.split("/").pop();
        return file || "index.html";
      } catch (e) {
        return "index.html";
      }
    };

    const fromEntry = event.activation.from;
    const toEntry = event.activation.entry;
    if (!fromEntry || !toEntry) return;

    const fromIndex = navOrder.indexOf(pageName(fromEntry.url));
    const toIndex = navOrder.indexOf(pageName(toEntry.url));
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    event.viewTransition.types.add(toIndex > fromIndex ? "forward" : "back");
  });
})();
