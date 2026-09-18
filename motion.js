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

  // --- Scroll-linked orb persistence + zigzag S-curve (every page) ---
  if (!reducedMotion) {
    const frame = document.querySelector(".orb-frame");
    const scrollSphere = frame ? frame.querySelector(".sphere") : null;
    const footer = document.querySelector("footer");
    const zigzagEls = Array.from(document.querySelectorAll(".zigzag"));

    if (frame && scrollSphere && footer) {
      let scrollQueued = false;
      // .hero's resting spot bleeds -5px past .page-header's flush edge
      // (see --orb-rest-right in style.css) — needed here to reconstruct
      // the same natural center in JS.
      const restRightTweak = frame.classList.contains("hero") ? 5 : 0;

      // h2 and p are block boxes sized to their container/max-width, not
      // to their actual glyphs — a short heading and a wrapped paragraph
      // both report a bounding-box edge far past where the visible text
      // really ends. Range.getClientRects() gives the real per-line
      // extent instead, so every safety check below is against genuinely
      // occupied pixels, not an assumed box.
      function textEdges(el) {
        const range = document.createRange();
        let left = Infinity;
        let right = -Infinity;
        el.querySelectorAll("h2, p").forEach((node) => {
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            left = Math.min(left, rect.left);
            right = Math.max(right, rect.right);
          }
        });
        // Ghost-links, the stack/status meta-list, and the contact pill are
        // already content-sized (no wasted box space the way a block h2/p
        // can have), so their own full hit-box — not just glyphs — is the
        // right thing to guard against overlapping.
        el.querySelectorAll(".ghost-link, .meta-list, .contact-placeholder").forEach((node) => {
          const rect = node.getBoundingClientRect();
          left = Math.min(left, rect.left);
          right = Math.max(right, rect.right);
        });
        return { left, right };
      }

      // Where the orb should sit while a given zigzag element is the one
      // in view, as a --scroll-x offset from its natural resting center.
      // Right-aligned elements now occupy the orb's own resting corner, so
      // clearing them is a hard requirement (measured, not assumed); left
      // -aligned elements never conflict with that corner, so the orb only
      // leans partway toward them for the weave, well inside the safe range.
      function targetFor(el, isRightAligned, naturalCenterX, orbHalfWidth) {
        const margin = 70;
        const edges = textEdges(el);
        const hasText = isFinite(edges.left) && isFinite(edges.right);

        if (isRightAligned) {
          if (!hasText) return 0;
          const maxAllowed = edges.left - margin - orbHalfWidth - naturalCenterX;
          return Math.min(0, maxAllowed);
        }

        if (!hasText) return -80;
        const minAllowed = edges.right + margin + orbHalfWidth - naturalCenterX;
        const lean = minAllowed * 0.7;
        return Math.max(minAllowed, Math.min(0, lean));
      }

      // Which zigzag element the viewport is currently over, and — only in
      // the genuinely empty gap between two of them — how far across that
      // gap. Bracketing by each element's own top/bottom (not just its
      // center) matters: a center-to-center blend starts easing toward the
      // *next* element's laxer target the instant it passes the midpoint,
      // even while the current element's text is still fully on screen,
      // which can relax a right-aligned element's hard safety clearance
      // while its own text is still there to overlap. Holding the exact
      // target for an element's entire own span, and blending only across
      // the real dead space after it, keeps every safety guarantee intact
      // for as long as that element is actually visible.
      function currentWeaveTarget(naturalCenterX, orbHalfWidth) {
        if (!zigzagEls.length) return 0;
        const anchorY = window.innerHeight * 0.5;
        const points = zigzagEls.map((el, i) => {
          const rect = el.getBoundingClientRect();
          return {
            el,
            isRight: i % 2 === 1,
            top: rect.top,
            bottom: rect.top + rect.height,
          };
        });

        const targetOf = (p) => targetFor(p.el, p.isRight, naturalCenterX, orbHalfWidth);

        for (const p of points) {
          if (anchorY >= p.top && anchorY <= p.bottom) return targetOf(p);
        }
        if (anchorY < points[0].top) return targetOf(points[0]);
        const last = points[points.length - 1];
        if (anchorY > last.bottom) return targetOf(last);

        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i];
          const b = points[i + 1];
          if (anchorY >= a.bottom && anchorY <= b.top) {
            const t = (anchorY - a.bottom) / Math.max(1, b.top - a.bottom);
            const smoothT = (1 - Math.cos(t * Math.PI)) / 2; // ease across the gap only
            const targetA = targetOf(a);
            const targetB = targetOf(b);
            return targetA + (targetB - targetA) * smoothT;
          }
        }
        return 0;
      }

      function updateScrollOrb() {
        scrollQueued = false;
        const frameHeight = frame.offsetHeight || 1;
        const scrollY = window.scrollY;
        const progress = Math.min(1, Math.max(0, scrollY / frameHeight));
        const scale = 1 - progress * 0.35; // recede as you scroll past the header
        const drift = -progress * 40; // px, drifts up slightly toward its resting slot

        const baseWidth = Math.min(320, window.innerWidth * 0.55);
        const frameRect = frame.getBoundingClientRect();
        const naturalCenterX = frameRect.right - restRightTweak - baseWidth / 2;
        const orbHalfWidth = (baseWidth * scale) / 2;

        // Fades the weave in only after the header has been scrolled past,
        // so the orb still sits dead-center in the rings at load (progress
        // 0) regardless of where the nearest zigzag element happens to be.
        const weaveX = currentWeaveTarget(naturalCenterX, orbHalfWidth) * progress;

        const footerTop = footer.getBoundingClientRect().top + scrollY;
        const fadeStart = footerTop - window.innerHeight * 1.2;
        const fadeEnd = footerTop - window.innerHeight * 0.4;
        const fadeRange = Math.max(1, fadeEnd - fadeStart);
        const fadeProgress = Math.min(1, Math.max(0, (scrollY - fadeStart) / fadeRange));

        scrollSphere.style.setProperty("--scroll-scale", scale.toFixed(3));
        scrollSphere.style.setProperty("--scroll-y", drift.toFixed(1) + "px");
        scrollSphere.style.setProperty("--scroll-x", weaveX.toFixed(1) + "px");
        scrollSphere.style.setProperty("--scroll-opacity", (1 - fadeProgress).toFixed(3));
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
