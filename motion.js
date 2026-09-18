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

      // Listens on window, not .orb-frame: .orb-frame is a normal block at
      // the top of the document, so once the page scrolls its box (and
      // therefore its pointermove hit area) scrolls away too, even though
      // .sphere itself stays fixed in the viewport. Using the sphere's own
      // live rect as the reference point keeps this working at any scroll
      // position, gated to a radius around the orb so distant cursor
      // positions elsewhere on a tall page don't pull it around.
      window.addEventListener("pointermove", (e) => {
        const rect = sphere.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const radius = Math.max(rect.width, rect.height) * 1.5;
        if (dist < 1 || dist > radius) {
          targetX = 0;
          targetY = 0;
          return;
        }
        const pull = 1 - dist / radius;
        targetX = (dx / dist) * followDistance * pull;
        targetY = (dy / dist) * followDistance * pull;
      }, { passive: true });

      window.addEventListener("pointerleave", () => {
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

      const EDGE_MARGIN = 70;

      // Where the orb should sit while a given zigzag element is the one
      // in view, as a --scroll-x offset from its natural resting center.
      // Right-aligned elements now occupy the orb's own resting corner, so
      // clearing them is a hard requirement (measured, not assumed); left
      // -aligned elements never conflict with that corner, so the orb only
      // leans partway toward them for the weave, well inside the safe range.
      function targetFor(el, isRightAligned, naturalCenterX, orbHalfWidth) {
        const edges = textEdges(el);
        const hasText = isFinite(edges.left) && isFinite(edges.right);

        if (isRightAligned) {
          if (!hasText) return 0;
          const maxAllowed = edges.left - EDGE_MARGIN - orbHalfWidth - naturalCenterX;
          return Math.min(0, maxAllowed);
        }

        if (!hasText) return -80;
        const minAllowed = edges.right + EDGE_MARGIN + orbHalfWidth - naturalCenterX;
        const lean = minAllowed * 0.7;
        return Math.max(minAllowed, Math.min(0, lean));
      }

      // The anchor-based weave above picks exactly one "owning" element (or
      // blends between two neighbors) based on scroll position alone. That
      // was safe when sections were spaced far apart, because by the time
      // the anchor moved on to a neighbor, the previous element had long
      // since scrolled clear of the orb's own fixed vertical band. With a
      // normally-paced gap, a section can still be physically within that
      // band even after the anchor and the blend have moved past it — so
      // the weave's preferred position also needs clamping against every
      // element that's ACTUALLY overlapping the orb's band right now, not
      // just the one the anchor currently designates. Left-aligned
      // elements impose a floor (don't drift further left than this);
      // right-aligned ones impose a ceiling (don't drift further right).
      function safeRangeAt(orbTop, orbBottom, naturalCenterX, orbHalfWidth) {
        let lower = -Infinity;
        let upper = Infinity;
        zigzagEls.forEach((el, i) => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < orbTop || rect.top > orbBottom) return;
          const edges = textEdges(el);
          if (!isFinite(edges.left)) return;
          if (i % 2 === 1) {
            upper = Math.min(upper, edges.left - EDGE_MARGIN - orbHalfWidth - naturalCenterX);
          } else {
            lower = Math.max(lower, edges.right + EDGE_MARGIN + orbHalfWidth - naturalCenterX);
          }
        });
        return { lower, upper };
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

        // The orb's own rendered band from the last applied frame — one
        // frame stale, negligible against a scroll-driven position that
        // only moves a few px between frames — used below to find which
        // elements it's actually next to right now (see safeRangeAt).
        const prevRect = scrollSphere.getBoundingClientRect();

        const baseWidth = Math.min(320, window.innerWidth * 0.55);
        const frameRect = frame.getBoundingClientRect();
        const naturalCenterX = frameRect.right - restRightTweak - baseWidth / 2;
        // The "breathing" resize below (up to +/-6%) is computed from the
        // weave position itself, which is circular — the weave's own safe
        // clearance depends on how big the orb is. Sizing the safety
        // clearance for the largest the orb could possibly breathe up to
        // keeps the overlap guarantee intact no matter what the real,
        // possibly-smaller breathed size ends up being.
        const orbHalfWidthSafe = (baseWidth * scale * 1.06) / 2;

        // Fades the weave in only after the header has been scrolled past,
        // so the orb still sits dead-center in the rings at load (progress
        // 0) regardless of where the nearest zigzag element happens to be.
        const preferredWeaveX = currentWeaveTarget(naturalCenterX, orbHalfWidthSafe) * progress;

        // Clamp the anchor-based preference against every element actually
        // overlapping the orb's own band right now (see safeRangeAt above) —
        // the anchor/blend picks a nice-looking position, but only this
        // clamp guarantees it never overlaps text that happens to still be
        // physically alongside the orb.
        const { lower, upper } = safeRangeAt(prevRect.top, prevRect.bottom, naturalCenterX, orbHalfWidthSafe);
        const weaveX = lower <= upper
          ? Math.min(upper, Math.max(lower, preferredWeaveX))
          : (lower + upper) / 2;

        // Subtle "breathing": lean further toward a text block (larger
        // |weaveX|) reads as tighter space, so the orb shrinks slightly;
        // near its natural center (weaveX ~ 0) it's in open space, so it
        // grows slightly. Driven by the same weave value as the S-curve
        // itself, so it reads as one fluid movement rather than a separate
        // pulsing effect.
        const openness = 1 - Math.min(1, Math.abs(weaveX) / 220);
        const breathe = 1 + (openness - 0.5) * 0.12;
        const finalScale = scale * breathe;

        // Fades out only in the real final stretch before the footer, never
        // while any zigzag content is still on screen — using a fixed
        // fraction of the viewport height here instead assumed the page was
        // a certain length, and clipped into the last section's visibility
        // on shorter pages once the zigzag gap was tightened up.
        const zigzagBottoms = zigzagEls.map((el) => el.getBoundingClientRect().bottom + scrollY);
        const lastContentBottom = zigzagBottoms.length ? Math.max(...zigzagBottoms) : 0;
        const footerTop = footer.getBoundingClientRect().top + scrollY;
        const fadeEnd = Math.max(lastContentBottom + 1, footerTop - window.innerHeight * 0.15);
        const fadeStart = Math.max(lastContentBottom, fadeEnd - window.innerHeight * 0.5);
        const fadeRange = Math.max(1, fadeEnd - fadeStart);
        const fadeProgress = Math.min(1, Math.max(0, (scrollY - fadeStart) / fadeRange));

        scrollSphere.style.setProperty("--scroll-scale", finalScale.toFixed(3));
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
