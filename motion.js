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
      // How much of the raw, freshly-computed target to move toward each
      // frame (0-1). Applied to both the S-curve's x-position and the
      // breathing scale so they glide rather than snap — the raw target
      // can jump between frames (a new element entering/leaving the orb's
      // band, or the anchor handing off between sections), and this is
      // what turns that into a continuous, single-direction-at-a-time
      // motion instead of a visible jump or backtrack.
      const WEAVE_LERP = 0.12;
      // +/-25% size swing — big enough to actually notice while scrolling
      // at a normal pace, not just on a before/after screenshot.
      const BREATHE_AMPLITUDE = 0.25;
      // Distance the weave fades in over at the very top of the page, so
      // the orb starts dead-center in the rings at load rather than
      // popping straight to a lean. Deliberately short and NOT tied to
      // the header's own height: safeRangeAt's bounds below are a hard
      // measurement of the orb's real current band, never faded, so if
      // this ramp were still running by the time a section's text
      // actually got close, the clamp would yank the still-suppressed
      // preferred value up to the full safe position in one frame — the
      // "double back" jump this fixes. 60px is long enough to not read as
      // a pop, short enough that it's always finished well before any
      // real section could reach the orb's band.
      const WEAVE_INTRO_DISTANCE = 60;
      // The safety clamp below has to assume the largest the orb could
      // possibly render at (see orbHalfWidthSafe) so a bigger breathing
      // swing needs a correspondingly bigger safety allowance here.
      const BREATHE_SAFETY_FACTOR = 1 + BREATHE_AMPLITUDE;

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

      // Persisted across frames so x-position and scale can glide toward
      // their freshly-computed targets (see WEAVE_LERP) instead of
      // snapping to them. Both start at their exact rest values (0 offset,
      // no breathe) rather than null-snapping to whatever the first tick's
      // raw target happens to be — that would either match the CSS resting
      // position by luck or pop straight to an offset on the very first
      // frame with nothing to ease from. Starting at rest and letting the
      // lerp ease in from there, the same way it eases every later target
      // change, is what actually keeps the orb dead-center in the rings at
      // load and gliding smoothly into its first lean.
      let currentWeaveX = 0;
      let currentBreatheScale = 1;

      function tickScrollOrb() {
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
        // The breathing resize below is computed from the weave position
        // itself, which is circular — the weave's own safe clearance
        // depends on how big the orb is. Sizing the safety clearance for
        // the largest the orb could possibly breathe up to keeps the
        // overlap guarantee intact no matter what the real, possibly-
        // smaller breathed size ends up being.
        const orbHalfWidthSafe = (baseWidth * scale * BREATHE_SAFETY_FACTOR) / 2;

        // Fades the weave in over WEAVE_INTRO_DISTANCE only — not over the
        // header's full height like the scale/drift above. See
        // WEAVE_INTRO_DISTANCE's own comment for why that distinction
        // matters: it used to share `progress`, which is what let the
        // safety clamp below yank an unrelated-but-still-fading-in value
        // straight to full strength once a section's text got close.
        const weaveIntro = Math.min(1, scrollY / WEAVE_INTRO_DISTANCE);
        const preferredWeaveX = currentWeaveTarget(naturalCenterX, orbHalfWidthSafe) * weaveIntro;

        // The raw, this-instant target: the anchor/blend's preference,
        // clamped against every element actually overlapping the orb's
        // band right now (see safeRangeAt above). This can still jump
        // between frames — a new element entering/leaving the band, or
        // the anchor/blend handing off between sections — which is exactly
        // what the lerp below smooths out.
        // A text-safety bound can demand a lean larger than the viewport
        // itself once a paragraph is wide relative to a narrow window —
        // clearing the text would otherwise push the orb's center clean
        // past the viewport edge, making it fully invisible. An orb that's
        // safely clear of the text but not actually on screen isn't
        // "safe," it's just gone, so this bound wins when the two conflict.
        const maxCenterBleed = orbHalfWidthSafe * 0.5;
        const viewportLower = -maxCenterBleed - naturalCenterX;
        const viewportUpper = window.innerWidth + maxCenterBleed - naturalCenterX;

        const { lower, upper } = safeRangeAt(prevRect.top, prevRect.bottom, naturalCenterX, orbHalfWidthSafe);
        const boundedLower = Math.max(lower, viewportLower);
        const boundedUpper = Math.min(upper, viewportUpper);
        const rawWeaveX = boundedLower <= boundedUpper
          ? Math.min(boundedUpper, Math.max(boundedLower, preferredWeaveX))
          : (viewportLower + viewportUpper) / 2;

        currentWeaveX += (rawWeaveX - currentWeaveX) * WEAVE_LERP;
        // Hard safety net, applied after smoothing: the lerp glides toward
        // a moving target, so it can briefly lag on the wrong side of a
        // *newly tightened* bound — this makes sure what actually renders
        // is never outside this frame's own measured-safe range, whatever
        // the smoothed value was heading toward.
        const weaveX = boundedLower <= boundedUpper
          ? Math.min(boundedUpper, Math.max(boundedLower, currentWeaveX))
          : (viewportLower + viewportUpper) / 2;
        currentWeaveX = weaveX;

        // Breathing: near its natural center (small weave offset) the orb
        // reads as being in open space and grows; leaning hard toward a
        // text block, it shrinks. Driven by the same weave value as the
        // S-curve itself, so size and position move as one motion — and
        // lerped by the same rate so they settle together, too.
        const openness = 1 - Math.min(1, Math.abs(weaveX) / 220);
        const rawBreathe = 1 + (openness - 0.5) * (BREATHE_AMPLITUDE * 2);
        currentBreatheScale += (rawBreathe - currentBreatheScale) * WEAVE_LERP;
        const finalScale = scale * currentBreatheScale;

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

        requestAnimationFrame(tickScrollOrb);
      }

      // Runs continuously (like the cursor-follow tick above) rather than
      // only on scroll/resize events, so the lerp above always has a
      // chance to keep gliding toward its target and fully settle even
      // after the user stops scrolling mid-transition.
      tickScrollOrb();
    }
  }
})();
