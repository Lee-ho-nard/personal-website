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

  // --- Scroll-linked orb: hand-authored GSAP ScrollTrigger waypoints ---
  // This replaces a previous real-time constraint solver, which
  // recomputed the orb's safe position and size from six-plus
  // interacting live measurements (text edges, band membership, viewport
  // bleed, breathing) fresh every single frame. That system's per-frame
  // rigor was also its ceiling: however many of its individual constants
  // got tuned, the motion it produced was still the visible *output* of
  // an equation being solved continuously, and it read that way. This
  // version instead hand-places a short sequence of waypoints per page
  // (see WAYPOINT_PLANS below) — roughly where each real .zigzag section
  // sits in the scroll, with a lean amount and size chosen by hand and
  // verified against real text edges at 700/1024/1700px, not recomputed
  // live — and lets GSAP's own ScrollTrigger `scrub` timeline tween
  // between them, which is smoother and better-suited to this than the
  // hand-rolled per-frame lerp it replaces.
  //
  // The old solver's absolute, measured-every-frame "never overlaps
  // text" guarantee is intentionally traded away here for something
  // softer: waypoints placed with real clearance at the three tested
  // widths, a simple (not live-solved) width-relative fallback for
  // narrower viewports — each waypoint's lean is a *fraction* of the
  // orb's own natural distance from the viewport's left edge, so it
  // shrinks safely on a narrower window without re-measuring anything —
  // and, site-wide now rather than just Home's Now/Contact, every
  // `.zigzag` block carries `position: relative; z-index: 1` (see
  // style.css) so that on the rare combination where a waypoint does
  // still end up close to a line of text, the text renders on top of
  // the orb rather than the other way around. That's the real safety
  // net in this version, not a live per-pixel clearance guarantee.
  if (!reducedMotion && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const frame = document.querySelector(".orb-frame");
    const scrollSphere = frame ? frame.querySelector(".sphere") : null;
    const footer = document.querySelector("footer");
    const zigzagEls = Array.from(document.querySelectorAll(".zigzag"));

    if (frame && scrollSphere && footer && zigzagEls.length) {
      // .hero's resting spot bleeds -5px past .page-header's flush edge
      // (see --orb-rest-right in style.css) — needed here to reconstruct
      // the same natural center in JS.
      const restRightTweak = frame.classList.contains("hero") ? 5 : 0;

      // The orb's base size (independent of the wobble below) at full
      // scroll depth, and how far into a page's real content (as a
      // fraction of the distance from the header's end to the last real
      // content) that growth finishes and levels off — both unchanged
      // from the previous system, just now evaluated once per waypoint
      // instead of live every frame (see depthBaseAt below).
      const BASE_GROWTH_PLATEAU = 1.65;
      const GROWTH_LEVEL_FRACTION = 0.6;
      // How far the orb drifts up into its resting slot over the header,
      // then holds — same value and shape as the previous system's own
      // scroll drift.
      const REST_DRIFT_Y = -40;

      // Per-page, per-.zigzag-index hand-placed lean, as a fraction of
      // naturalCenterX (the orb's own natural resting distance from the
      // viewport's left edge) — not a fixed px amount, so the same
      // fraction scales safely down on a narrower window without
      // re-measuring text at runtime (see the block comment above).
      // Negative leans left (toward the .zigzag:nth-of-type(even)
      // elements' own resting corner — see style.css — which is where
      // the orb naturally sits, so those are the ones that need a real,
      // decisive lean to clear); values chosen and verified by hand
      // against real text edges (Range.getClientRects(), the same
      // technique the old solver used) at 700/1024/1700px:
      //
      // - Elements that flip to the orb's own resting corner (Work/Life
      //   on Home, the second card on Work, About's two `.about-block--
      //   narrow` blocks, Life's second block) need a real lean to clear
      //   their text — big (~0.8-0.86) for the full-width ones, smaller
      //   (~0.65-0.68) for About's narrower ones (see
      //   `.about-block--narrow` in style.css).
      // - Elements that stay in normal left-aligned flow (Now/About on
      //   Home, Flit, About's Intro/Building Flit, Life's Languages)
      //   already sit well clear of that corner at every tested width,
      //   so their lean here is a small, purely stylistic drift, not a
      //   clearance requirement.
      // - Home's Contact and Work's Flit are the two exceptions worth
      //   naming: both are left-aligned but wide enough (Contact's own
      //   mailto ghost-link; Flit's two full paragraphs + meta-list) that
      //   at 700px specifically neither has real room to clear the orb's
      //   resting corner in either direction — a genuine content/geometry
      //   limit, not a bug (the previous system hit the same wall here,
      //   see design.md's old `--zigzag-gap` note). Their lean stays
      //   small and deliberately doesn't chase full clearance; the
      //   z-index fallback above is what keeps their text legible on the
      //   rare narrow-viewport scroll position where the orb ends up
      //   close.
      // Re-verified against measured overlap (not just the static text
      // edges) at 700/1024/1700px after the first pass: depthBase grows
      // faster, in absolute scroll terms, on a page with less total
      // content (Work/Life's `growthLevelAt` is much sooner than Home's),
      // so even the "understated" waypoints there needed to shrink
      // further, and the "decisive" ones needed to push further left, to
      // hold the same real clearance this plan targets everywhere.
      // Re-derived analytically (not by trial against the live, jittered
      // timeline) after the section-heading size increase: a heading
      // this large pushes real text edges close enough to the orb's own
      // natural rest position that several "understated" left-aligned
      // waypoints actually needed a small *rightward* lean to clear,
      // not just a smaller leftward one — the opposite direction from
      // before. Work and Life's second waypoint (the only zigzag element
      // on an otherwise-short page, so depth-growth is already at its
      // plateau by the time it's reached) can't fully clear at 1024px
      // even at this solver's -0.98 ceiling — a real, accepted residual
      // overlap there, on the same terms as Home's Contact always was:
      // covered by the z-index fallback, not a live guarantee.
      const WAYPOINT_PLANS = {
        home: [0.10, -0.90, 0.10, -0.90, 0.15],
        work: [0.12, -0.98],
        about: [0.05, -0.65, 0.05, -0.65],
        life: [0.11, -0.98],
      };
      const page = document.body.dataset.orbPage;
      const leans = (page && WAYPOINT_PLANS[page])
        || zigzagEls.map((_, i) => (i % 2 === 1 ? -0.8 : -0.18));

      // One-time load randomization: nudges each waypoint's lean, size
      // and scroll-timing slightly so the overall path's shape — which
      // elements get a big vs. small lean, roughly where they sit — stays
      // the same every load, but no two page loads (or scroll sessions)
      // trace pixel-identical motion. Generated once here, not re-rolled
      // in build() below, so a resize-triggered rebuild doesn't change
      // the path mid-session.
      const jitter = zigzagEls.map(() => ({
        lean: gsap.utils.random(-0.05, 0.05),
        scale: gsap.utils.random(-0.04, 0.04),
        t: gsap.utils.random(-0.015, 0.015),
      }));

      let ctx = null;

      function build() {
        if (ctx) ctx.revert();

        ctx = gsap.context(() => {
          // Mirrors the .sphere CSS rule's own width/height (min(520px,
          // 18vw)) exactly — see the equivalent comment the previous
          // system carried; if the two formulas ever diverge, this is
          // reasoning about a size the orb doesn't actually render at.
          const baseWidth = Math.min(window.innerWidth * 0.18, 520);
          const frameRect = frame.getBoundingClientRect();
          const naturalCenterX = frameRect.right - restRightTweak - baseWidth / 2;
          const frameHeight = frame.offsetHeight || 1;
          const scrollYNow = window.scrollY;

          // How far down the real content actually goes on this page,
          // used both for the depth-growth curve and the footer-fade
          // below — same "measure the real page, don't assume a length"
          // approach the previous system used.
          const zigzagBottoms = zigzagEls.map((el) => el.getBoundingClientRect().bottom + scrollYNow);
          const lastContentBottom = Math.max(...zigzagBottoms);
          const growthLevelAt = frameHeight + Math.max(1, lastContentBottom - frameHeight) * GROWTH_LEVEL_FRACTION;
          // Starts at 1 right at scroll 0 and grows smoothly and
          // monotonically from there — no header-recede dip feeding into
          // it, same fix as before, just evaluated at each waypoint's own
          // absolute scroll position instead of live every frame.
          const depthBaseAt = (y) => 1 + (BASE_GROWTH_PLATEAU - 1) * Math.min(1, Math.max(0, y / growthLevelAt));

          // Fades out only in the real final stretch before the footer,
          // exactly mirroring the previous system's own measured
          // fadeStart/fadeEnd rather than a fixed scroll fraction — a
          // fixed fraction doesn't know how long the actual content is
          // and can clip into a short page's last section.
          const footerTop = footer.getBoundingClientRect().top + scrollYNow;
          const fadeEnd = Math.max(lastContentBottom + 1, footerTop - window.innerHeight * 0.15);
          const fadeStart = Math.max(lastContentBottom, fadeEnd - window.innerHeight * 0.5);

          // One waypoint per real .zigzag element, positioned at that
          // element's own real vertical center (absolute document Y, so
          // it's tied to the real page geometry, not an assumed even
          // spacing) — lean and scale are hand-authored (see
          // WAYPOINT_PLANS), not recomputed against live text here.
          const points = zigzagEls.map((el, i) => {
            const rect = el.getBoundingClientRect();
            const absMid = rect.top + rect.height / 2 + scrollYNow;
            // ScrollTrigger's own progress (and so the timeline's
            // playhead) is driven by scrollY — how far the viewport's own
            // *top* has scrolled — not by which element currently sits at
            // the viewport's vertical center. Subtracting half the
            // viewport height converts "the element's real center" into
            // "the scrollY at which that center actually lines up with
            // the viewport's own center," which is the scroll position
            // this waypoint should actually be reached at.
            const targetScrollY = absMid - window.innerHeight / 2;
            // Simple (not live-solved) fallback: clamps the jittered lean
            // to a sane range so no combination of hand-authored value +
            // random perturbation can send the orb's center past the
            // viewport's own left edge.
            const lean = Math.max(-0.98, Math.min(0.2, (leans[i] ?? -0.2) + jitter[i].lean));
            return {
              y: Math.max(1, Math.min(fadeEnd - 1, targetScrollY + jitter[i].t * fadeEnd)),
              x: lean * naturalCenterX,
              scale: depthBaseAt(absMid) * (1 + jitter[i].scale),
            };
          }).sort((a, b) => a.y - b.y);

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: () => fadeEnd,
              scrub: 0.6,
            },
          });

          tl.set(scrollSphere, {
            "--scroll-x": "0px",
            "--scroll-y": "0px",
            "--scroll-scale": 1,
            "--scroll-opacity": 1,
          });
          tl.to(scrollSphere, { "--scroll-y": REST_DRIFT_Y + "px", duration: frameHeight, ease: "none" }, 0);

          let prevY = 0;
          points.forEach((p) => {
            const duration = Math.max(1, p.y - prevY);
            tl.to(scrollSphere, {
              "--scroll-x": p.x.toFixed(1) + "px",
              "--scroll-scale": Number(p.scale.toFixed(3)),
              ease: "sine.inOut",
              duration,
            }, prevY);
            prevY = p.y;
          });

          tl.to(scrollSphere, {
            "--scroll-opacity": 0,
            ease: "none",
            duration: Math.max(1, fadeEnd - fadeStart),
          }, fadeStart);
        }, frame);
      }

      build();

      let resizeTimer;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 200);
      });

      // Organic idle wobble: unrelated to scroll or cursor state at all,
      // purely time-driven, layered on top of the GSAP-driven scroll
      // position via its own CSS custom properties (see style.css's
      // transform chain) so it keeps running independently of whatever
      // the waypoint timeline is doing, exactly as before — it's just no
      // longer computed inside the same per-frame tick as the scroll
      // position, since that position is now GSAP's own tween rather
      // than a hand-rolled lerp. Two summed sine terms per axis at slow,
      // mutually unrelated periods (~35-140s) so the combined path
      // doesn't read as a simple back-and-forth, the way a lava lamp
      // never quite repeats itself; amplitude scales with the orb's own
      // current baseWidth so it reads as proportionally the same
      // restlessness at any size.
      (function tickOrganic() {
        const baseWidth = Math.min(window.innerWidth * 0.18, 520);
        const t = performance.now() / 1000;
        const ampX = baseWidth * 0.07;
        const ampY = baseWidth * 0.045;
        const x = ampX * Math.sin(t * 0.13 + 1.7) + ampX * 0.5 * Math.sin(t * 0.071 + 4.1);
        const y = ampY * Math.sin(t * 0.091 + 0.6) + ampY * 0.5 * Math.sin(t * 0.047 + 2.3);
        const scale = 1
          + 0.025 * Math.sin(t * 0.061 + 0.9)
          + 0.015 * Math.sin(t * 0.103 + 3.4);
        scrollSphere.style.setProperty("--organic-x", x.toFixed(2) + "px");
        scrollSphere.style.setProperty("--organic-y", y.toFixed(2) + "px");
        scrollSphere.style.setProperty("--organic-scale", scale.toFixed(3));
        requestAnimationFrame(tickOrganic);
      })();
    }
  }
})();
