// Cursor-reactive + scroll-linked motion: the orb's liquid press effect,
// magnetic buttons/nav links, and the Home-only scroll-linked orb. Each
// effect is gated independently — scroll-linking only needs reduced-motion
// off; cursor effects also need a real pointer.
(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const styles = getComputedStyle(document.documentElement);
  const px = (name, fallback) => parseFloat(styles.getPropertyValue(name)) || fallback;
  const durStr = (name, fallback) => {
    const raw = styles.getPropertyValue(name).trim();
    return /^[\d.]+m?s$/.test(raw) ? raw : fallback;
  };
  // Mirrors .sphere's own CSS width/height (min(580px, 20vw)) — the one
  // formula every scroll/filter system below measures the orb's real
  // size against, so it's centralized here instead of the three
  // separate inline copies this used to be. `window.innerWidth` reading
  // as 0 (confirmed live, not hypothetical — see design.md's note on
  // the liquid-filter Infinity bug this caused) is exactly what the
  // `|| document.documentElement.clientWidth || 800` fallback chain
  // guards against; any one of these being transiently 0/undefined at
  // the moment a script first runs no longer produces a 0 or NaN size
  // that some downstream division (see the liquid filter) can't
  // recover from.
  const baseOrbWidth = () => {
    const w = window.innerWidth || document.documentElement.clientWidth || 800;
    return Math.min(w * 0.2, 580);
  };

  // --- Liquid/goo SVG filter (every page, replaces the old CSS
  // border-radius wobble) ---
  // A real feTurbulence + feDisplacementMap filter, not a border-radius
  // trick: border-radius can only ever draw a rounded-rectangle-family
  // shape (so its "organic" version reads as a lumpy oval, never as
  // independent asymmetric bumps/dents), because it's reshaping the
  // element's own box, not its rendered pixels. A displacement-map
  // filter instead pushes every pixel of the actual rendered gradient
  // around by a noise field, which is what produces genuine, uneven,
  // water-droplet-like edges. The former hue-drift CSS animation is
  // folded into this same filter too (as an feColorMatrix), rather than
  // living on `.sphere` as a separate `filter` keyframe animation — CSS
  // can only have one `filter` value active on an element at a time, so
  // an old-style `animation: orb-hue-drift ...` would have silently
  // clobbered a static `filter: url(#orb-goo)` (or vice versa) every
  // frame. Bundling both into one SVG filter graph removes that
  // conflict entirely and keeps `.sphere`'s own `filter` property a
  // single, static reference.
  if (!reducedMotion) {
    const frame = document.querySelector(".orb-frame");
    const sphere = frame ? frame.querySelector(".sphere") : null;

    if (frame && sphere) {
      const SVG_NS = "http://www.w3.org/2000/svg";
      const svgEl = (tag, attrs) => {
        const el = document.createElementNS(SVG_NS, tag);
        for (const key in attrs) el.setAttribute(key, attrs[key]);
        return el;
      };

      // Rough, deliberately conservative low-end signal: real per-device
      // frame-budget testing isn't something a load-time script can do
      // (see the perf notes in design.md for what *was* measured, live,
      // during development) — hardwareConcurrency is just a coarse proxy
      // available before any frames have even rendered. Used only to
      // decide whether the more expensive cursor-press layer and the
      // full update rate are worth it, never to disable the ambient
      // effect entirely (that one's a fixed, filter-graph-time cost, not
      // a per-frame one — see buildLiquidFilter's own comment).
      const isLikelyLowEnd = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;

      // Reusable factory: builds one complete <filter> (ambient
      // turbulence + hue rotation, both animated via SMIL so they cost
      // nothing on the JS thread; an optional cursor-press layer that
      // JS *does* drive, since it has to track real pointer input) and
      // appends it to a single shared, hidden <svg> defs host shared by
      // every filter on the page. Takes the target's real natural size
      // (in px, at scale 1 — i.e. before any `transform: scale()`, which
      // the filtered result rides along with automatically since the
      // whole element is rasterized-then-scaled) and derives every
      // geometric value from it — baseFrequency as "N cycles across the
      // element," displacement as "a fraction of the element's own
      // size" — rather than a `primitiveUnits="objectBoundingBox"`
      // filter with fixed unitless values, which is the spec-correct
      // way to get this but measurably did *not* behave consistently
      // across element sizes in testing (feTurbulence's bbox-relative
      // frequency handling is a known cross-engine soft spot). Deriving
      // the same numbers from real px in JS instead is what actually
      // makes this reusable at another scale later — pass the bleed
      // element's own size to the same function and it reproduces the
      // same *relative* look, without touching the filter graph itself.
      function getFilterHost() {
        let host = document.getElementById("liquid-filter-defs");
        if (host) return host;
        host = svgEl("svg", { id: "liquid-filter-defs", "aria-hidden": "true", focusable: "false" });
        host.style.position = "absolute";
        host.style.width = "0";
        host.style.height = "0";
        host.style.overflow = "hidden";
        const defs = svgEl("defs", {});
        host.appendChild(defs);
        document.body.appendChild(host);
        return host;
      }

      // sizePx: the element's own natural (untransformed) width/height in
      // px — used to convert every "N cycles" / "fraction of size" knob
      // below into the absolute px values feTurbulence/feDisplacementMap
      // actually take (their default `primitiveUnits="userSpaceOnUse"`
      // is what's reliably supported, unlike objectBoundingBox — see the
      // comment above).
      function buildLiquidFilter(id, sizePx, opts) {
        // Defense in depth, independent of baseOrbWidth's own fallback
        // chain: whatever sizePx actually arrives as (0, NaN, undefined,
        // negative — a live, confirmed failure mode, not a hypothetical
        // one, see baseOrbWidth's comment), every frequency below is a
        // division by it. A future caller passing this function a
        // differently-sourced size (the planned bleed reuse) gets the
        // same guarantee without having to know that history.
        const safeSizePx = Number.isFinite(sizePx) && sizePx > 0 ? sizePx : 1;
        const o = Object.assign({
          // cycles across the element at each SMIL keyframe — kept under
          // 1.5 (was 1.5-2.3) so each cycle reads as one broad, rolling
          // lobe rather than the many small close-together "needle" bumps
          // a higher cycle count produces once actually displaced (a
          // real, confirmed look, not hypothetical — cranking baseFrequency
          // down is what turns that into a lava-lamp-style few-big-bumps
          // silhouette). numOctaves stays at 1 for the same reason.
          ambientBumps: [0.9, 1.25, 0.75, 1.1, 0.9],
          ambientOctaves: 1,
          ambientSeed: 5,
          ambientDuration: durStr("--duration-orb-blob", "46s"),
          hueDuration: durStr("--duration-orb", "48s"),
          displacementFraction: 0.09, // final feDisplacementMap scale = this * sizePx
          pressBumps: 3, // same broad-lobe intent as ambientBumps, just a little tighter since it's meant to read as one localized push, not the whole silhouette
          pressOctaves: 1, // was 2 — the extra octave added fine texture that fought the same broad-bump goal as ambientBumps
          pressSeed: 11,
          enablePress: true,
        }, opts);

        const defs = getFilterHost().querySelector("defs");
        const ambientFrequency = o.ambientBumps.map((n) => n / safeSizePx);
        const pressFrequency = o.pressBumps / safeSizePx;
        const displacementScale = o.displacementFraction * safeSizePx;

        // Cursor "press" position/reach, expressed as an ordinary radial
        // gradient (white -> transparent) and pulled into the filter via
        // feImage — this is what turns a second turbulence layer into
        // something that fades in with distance from a specific point
        // instead of applying uniformly. r starts at 0 (no visible press)
        // and is animated toward a real radius by JS only while the
        // cursor is actually near the element (see the tick loop below).
        //
        // The gradient is baked into feImage's href as a self-contained
        // data: URI SVG string, NOT referenced by fragment id (href="#...")
        // pointing at a local <radialGradient>/<rect> living in this same
        // document — confirmed live that a local-element feImage reference
        // silently rasterizes to nothing in this browser (feImage only
        // reliably paints an external image resource), which is what made
        // the whole press layer a permanent no-op regardless of cursor
        // position. Rebuilding this string on every press-tick is what
        // "moving" the gradient now means.
        const pressMaskUri = (cxPct, cyPct, rPct) => {
          const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">' +
            '<defs><radialGradient id="g" cx="' + cxPct + '%" cy="' + cyPct + '%" r="' + rPct + '%">' +
            '<stop offset="0%" stop-color="#fff" stop-opacity="1"/>' +
            '<stop offset="60%" stop-color="#fff" stop-opacity="0.55"/>' +
            '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
            '</radialGradient></defs>' +
            '<rect x="0" y="0" width="1" height="1" fill="url(#g)"/></svg>';
          return "data:image/svg+xml," + encodeURIComponent(svg);
        };

        const filter = svgEl("filter", {
          id,
          x: "-60%", y: "-60%", width: "220%", height: "220%",
          "color-interpolation-filters": "sRGB",
        });

        const ambient = svgEl("feTurbulence", {
          type: "fractalNoise",
          baseFrequency: String(ambientFrequency[0]),
          numOctaves: String(o.ambientOctaves),
          seed: String(o.ambientSeed),
          result: "ambientTurb",
        });
        const ambientAnim = svgEl("animate", {
          attributeName: "baseFrequency",
          values: ambientFrequency.join(";"),
          dur: o.ambientDuration,
          repeatCount: "indefinite",
          calcMode: "spline",
          keySplines: ambientFrequency.slice(1).map(() => "0.4 0 0.2 1").join(";"),
        });
        ambient.appendChild(ambientAnim);
        filter.appendChild(ambient);

        let noiseSource = "ambientTurb";
        let feImageEl = null;

        if (o.enablePress) {
          // x/y/width/height as percentages (not the same 0/1 unit
          // square the mask's own viewBox uses) since percentages on a
          // filter primitive's own subregion always resolve against the
          // filter region regardless of primitiveUnits, sidestepping the
          // same reliability question that ruled out objectBoundingBox
          // above.
          feImageEl = svgEl("feImage", {
            href: pressMaskUri(50, 50, 0), x: "0%", y: "0%", width: "100%", height: "100%",
            result: "cursorMask", preserveAspectRatio: "none",
          });
          filter.appendChild(feImageEl);
          filter.appendChild(svgEl("feTurbulence", {
            type: "turbulence", baseFrequency: String(pressFrequency),
            numOctaves: String(o.pressOctaves), seed: String(o.pressSeed), result: "pressTurbRaw",
          }));
          // Two bugs lived here together, both traced to the same root
          // cause: feDisplacementMap's neutral (no-displacement) value is
          // 0.5, not 0, but masking pressBoosted's R/G by cursorMask's
          // alpha via a plain feComposite "in" multiplies every channel
          // value TOWARD 0 as the mask fades out — which, anywhere the
          // boosted noise sat above 0.5, drags it back down *past* 0.5 on
          // its way to 0, flipping the local displacement's sign in a
          // ring partway through the falloff. That's what produced two
          // outward "hills" flanking the intended inward dent instead of
          // one clean press, confirmed live. Fixed two ways at once:
          // feFuncR/feFuncG now use a `type="table"` remap that floors at
          // exactly 0.5 (never crosses it, unlike the old symmetric
          // linear boost) instead of spanning both sides; and the old
          // arithmetic *add* of pressMasked onto ambientTurb is replaced
          // with a proper alpha-weighted `over` composite, a true convex
          // blend between the two that can never overshoot past either
          // one — so no value in the falloff ring can land outside the
          // [ambientTurb, pressBoosted] range, closing off the ring
          // artifact geometrically rather than just shrinking it.
          // feFuncA on both inputs forces a flat alpha of 1 first, since
          // feTurbulence's own alpha channel is independently noisy by
          // default and would otherwise silently skew the blend weights
          // away from cursorMask's actual falloff.
          const boost = svgEl("feComponentTransfer", { in: "pressTurbRaw", result: "pressBoosted" });
          boost.appendChild(svgEl("feFuncR", { type: "table", tableValues: "0.5 0.5 1" }));
          boost.appendChild(svgEl("feFuncG", { type: "table", tableValues: "0.5 0.5 1" }));
          boost.appendChild(svgEl("feFuncA", { type: "discrete", tableValues: "1" }));
          filter.appendChild(boost);
          const ambientOpaque = svgEl("feComponentTransfer", { in: "ambientTurb", result: "ambientOpaque" });
          ambientOpaque.appendChild(svgEl("feFuncA", { type: "discrete", tableValues: "1" }));
          filter.appendChild(ambientOpaque);
          filter.appendChild(svgEl("feComposite", { in: "pressBoosted", in2: "cursorMask", operator: "in", result: "pressMasked" }));
          filter.appendChild(svgEl("feComposite", {
            in: "pressMasked", in2: "ambientOpaque", operator: "over", result: "combinedNoise",
          }));
          noiseSource = "combinedNoise";
        }

        filter.appendChild(svgEl("feDisplacementMap", {
          in: "SourceGraphic", in2: noiseSource, scale: String(displacementScale),
          xChannelSelector: "R", yChannelSelector: "G", result: "displaced",
        }));

        // Folds the old orb-hue-drift CSS keyframe animation in here —
        // see the block comment above for why it has to live inside the
        // same filter rather than as a separate `filter` animation.
        const hue = svgEl("feColorMatrix", { in: "displaced", type: "hueRotate", values: "0" });
        hue.appendChild(svgEl("animate", {
          attributeName: "values", from: "0", to: "360", dur: o.hueDuration, repeatCount: "indefinite",
        }));
        filter.appendChild(hue);

        defs.appendChild(filter);
        return {
          filter,
          setPress: feImageEl
            ? (cxPct, cyPct, rPct) => feImageEl.setAttribute("href", pressMaskUri(cxPct.toFixed(1), cyPct.toFixed(1), rPct.toFixed(1)))
            : () => {},
        };
      }

      // Only recomputed on resize, not on scroll: the orb's scroll-depth
      // growth is a `transform: scale()` applied on top of this natural
      // size, which scales the already-filtered result wholesale rather
      // than changing the element's own box, so the filter never needs
      // to react to it.
      const orbSize = baseOrbWidth;

      const filterId = "orb-goo";
      // numOctaves=1 on both layers regardless of device tier now (see
      // buildLiquidFilter's own defaults) — hardwareConcurrency no longer
      // has a texture lever to pull, only the press tick's own update
      // rate below.
      const liquidOpts = () => ({
        enablePress: canHover,
      });
      let liquid = buildLiquidFilter(filterId, orbSize(), liquidOpts());
      sphere.style.filter = "url(#" + filterId + ")";

      // window.innerWidth (and even document.documentElement.clientWidth)
      // can read 0 at the exact moment this script first runs on a fresh
      // navigation — confirmed live in production, not hypothetical (see
      // baseOrbWidth's own comment) — which the fallback chain there
      // absorbs into a rough guess rather than a broken filter, but a
      // guess all the same. One requestAnimationFrame later, a real
      // layout pass has always happened, so rebuild once, immediately,
      // with the now-accurate size — cheap enough (one extra filter
      // build, once, at load) that the very first thing a visitor sees
      // isn't left depending on a `resize` event that may never come to
      // correct a merely-approximate initial guess.
      requestAnimationFrame(() => {
        liquid.filter.remove();
        liquid = buildLiquidFilter(filterId, orbSize(), liquidOpts());
      });

      let resizeTimer;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          // The <filter> is the only id-bearing piece this factory still
          // creates (the press mask lives entirely in a feImage href
          // string now, not as separate defs) — has to go before
          // rebuilding with the same id, or the stale one lingers as an
          // orphaned duplicate-id element.
          liquid.filter.remove();
          liquid = buildLiquidFilter(filterId, orbSize(), liquidOpts());
        }, 200);
      });

      // Cursor "press": gated the same way as every other cursor effect
      // on the site (fine pointer + hover-capable only) — reads the
      // sphere's own live rect rather than the page-top .orb-frame box,
      // since its fixed viewport position diverges from any ancestor's
      // document position once the page scrolls.
      if (canHover) {
        let targetPX = 0.5;
        let targetPY = 0.5;
        let targetIntensity = 0;
        let currentPX = 0.5;
        let currentPY = 0.5;
        let currentIntensity = 0;
        const PRESS_RADIUS = 42; // max visible gradient radius, in % of the sphere's own bbox
        const PRESS_LERP = 0.15;

        window.addEventListener("pointermove", (e) => {
          const rect = sphere.getBoundingClientRect();
          const fx = (e.clientX - rect.left) / rect.width;
          const fy = (e.clientY - rect.top) / rect.height;
          const dx = fx - 0.5;
          const dy = fy - 0.5;
          const dist = Math.hypot(dx, dy);
          // A little past the visible edge — reads as "pressing into"
          // the orb starting just before the cursor visually reaches it,
          // not only once it's exactly inside.
          if (dist > 0.9) {
            targetIntensity = 0;
            return;
          }
          targetPX = fx;
          targetPY = fy;
          targetIntensity = 1;
        }, { passive: true });

        window.addEventListener("pointerleave", () => {
          targetIntensity = 0;
        });

        // Throttled to every other frame (~30fps on a 60Hz display) as
        // a cheap, always-on mitigation for the one part of this effect
        // that's genuinely JS-driven per frame — see design.md for the
        // measured cost this is guarding against. The ambient turbulence
        // and hue rotation above never touch JS at all (pure SMIL), so
        // they aren't affected by this throttle.
        let frameSkip = 0;
        const updateRate = isLikelyLowEnd ? 3 : 2;
        (function tickPress() {
          frameSkip = (frameSkip + 1) % updateRate;
          if (frameSkip === 0) {
            currentPX += (targetPX - currentPX) * PRESS_LERP;
            currentPY += (targetPY - currentPY) * PRESS_LERP;
            currentIntensity += (targetIntensity - currentIntensity) * PRESS_LERP;
            liquid.setPress(currentPX * 100, currentPY * 100, currentIntensity * PRESS_RADIUS);
          }
          requestAnimationFrame(tickPress);
        })();
      }
    }
  }

  // --- Ambient glow + sparse particles (every page, purely decorative —
  // genuinely independent of the five systems above: reconstructs
  // .sphere's own transform from its live custom-property *values*
  // (plain inline-style reads, not getComputedStyle — see readSphereTransform's
  // own comment) rather than sharing or re-deriving any of their internal
  // state, and never touches the SVG filter/displacement graph at all). ---
  {
    const frame = document.querySelector(".orb-frame");
    const sphere = frame ? frame.querySelector(".sphere") : null;

    if (frame && sphere) {
      const glow = document.createElement("div");
      glow.className = "orb-glow";
      glow.setAttribute("aria-hidden", "true");
      frame.insertBefore(glow, sphere);

      if (!reducedMotion) {
        // Same coarse, conservative low-end signal as the liquid filter's
        // own (re-declared locally rather than shared, so this block
        // stays a self-contained, independent addition).
        const isLikelyLowEnd = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;

        // Pauses both systems below when the orb itself is off-screen —
        // .sphere is position:fixed, so a plain viewport-root observer is
        // enough. rootMargin gives both a head start/tail rather than a
        // visible pop right at the edge of the viewport.
        let orbVisible = true;
        new IntersectionObserver((entries) => {
          orbVisible = entries[entries.length - 1].isIntersecting;
        }, { rootMargin: "100px" }).observe(sphere);

        const canvas = document.createElement("canvas");
        canvas.className = "orb-particles";
        canvas.setAttribute("aria-hidden", "true");
        frame.insertBefore(canvas, sphere);
        const ctx = canvas.getContext("2d");
        // CANVAS_SIZE is the logical drawing space every coordinate below
        // is written in; the backing store itself is scaled up by the
        // device's real pixel ratio (and ctx scaled to match) so motes
        // stay crisp on high-DPI screens instead of being upscaled/soft —
        // CSS still gives the element its on-screen box size, same
        // "draw once, let the transform scale it" approach the orb's own
        // liquid filter already relies on for growth.
        const CANVAS_SIZE = 300;
        function applyDpr() {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = CANVAS_SIZE * dpr;
          canvas.height = CANVAS_SIZE * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        applyDpr();
        // window.devicePixelRatio reading wrong (1 instead of the real
        // ratio) at the exact moment a script first runs is the same
        // failure mode confirmed live for window.innerWidth elsewhere in
        // this file (see baseOrbWidth's own comment) — cheap enough to
        // guard the same way: one corrective re-check after a real
        // layout/paint pass has definitely happened, rather than trusting
        // the very first read. setTransform (not scale) so this second
        // call replaces the matrix instead of compounding onto it.
        requestAnimationFrame(applyDpr);

        // Reconstructs .sphere's own transform from the exact same
        // custom-property values its CSS rule (.orb-frame .sphere in
        // style.css) reads, instead of getComputedStyle(sphere).transform
        // — reading a *computed* value forces a style recalculation, and
        // if the scroll-waypoint timeline or the organic-wobble tick
        // (both outside this block, so their call order relative to this
        // one isn't something this block controls) had already written a
        // fresh transform earlier the same frame, that recalculation
        // would be real, avoidable work. Reading the raw inline-style
        // values back via getPropertyValue is a plain property lookup —
        // no cascade involved at all — so this stays cheap regardless of
        // write order.
        function readSphereTransform() {
          const sx = sphere.style.getPropertyValue("--scroll-x") || "0px";
          const sy = sphere.style.getPropertyValue("--scroll-y") || "0px";
          const ox = sphere.style.getPropertyValue("--organic-x") || "0px";
          const oy = sphere.style.getPropertyValue("--organic-y") || "0px";
          const ss = sphere.style.getPropertyValue("--scroll-scale") || "1";
          const os = sphere.style.getPropertyValue("--organic-scale") || "1";
          return `translate(${sx}, ${sy}) translate(${ox}, ${oy}) scale(${ss}) scale(${os})`;
        }

        let frameSkip = 0;
        const updateRate = isLikelyLowEnd ? 3 : 2;
        (function tickPosition() {
          frameSkip = (frameSkip + 1) % updateRate;
          if (frameSkip === 0 && orbVisible) {
            const t = readSphereTransform();
            glow.style.transform = t;
            canvas.style.transform = t;
          }
          requestAnimationFrame(tickPosition);
        })();

        const hueDurationSec = parseFloat(durStr("--duration-orb", "48s")) || 48;

        // Phase-locks the glow's CSS hue-rotate to the SVG filter's own
        // SMIL hue rotation via a negative animation-delay, rather than
        // just trusting matching durations to stay in sync — the two run
        // on entirely different animation engines (CSS vs. SMIL) that
        // can drift apart whenever either gets throttled/paused
        // independently, a backgrounded tab especially. Re-synced on
        // visibilitychange for exactly that case. (Confirmed by reading
        // the filter graph, not assumed: the SMIL animation is on
        // feColorMatrix type="hueRotate" — a true hue rotation of the
        // rendered pixels, the same kind of operation as CSS's own
        // hue-rotate(), not a rotation of any geometry — the silhouette
        // morph is a fully separate feTurbulence/baseFrequency animation.
        // So the only real approximation left is that the glow rotates
        // its own separate gradient rather than literally sampling the
        // orb's rendered pixels — the rotation mechanism itself matches.)
        function syncGlowPhase() {
          const svgHost = document.getElementById("liquid-filter-defs");
          if (!svgHost || typeof svgHost.getCurrentTime !== "function") return;
          const t = svgHost.getCurrentTime() % hueDurationSec;
          glow.style.animationDelay = "-" + t.toFixed(3) + "s";
          // A negative animation-delay only takes effect as a phase
          // offset at the moment the animation (re)starts — setting it
          // on an already-running animation (exactly what happens on the
          // visibilitychange re-sync below) does not retroactively seek
          // it, confirmed live: the glow kept drifting at its old phase
          // after the delay was updated. Dropping animation-name and
          // restoring it after a forced reflow read is what actually
          // makes the new delay take effect immediately, on every call.
          glow.style.animationName = "none";
          void glow.offsetWidth;
          glow.style.animationName = "";
        }
        syncGlowPhase();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") syncGlowPhase();
        });

        const baseHues = [45, 336, 199]; // gradient's three chromatic stops (yellow/pink/blue) — white has no hue to sample
        const hueFor = (baseHue) => (baseHue + ((performance.now() / 1000) % hueDurationSec) / hueDurationSec * 360) % 360;

        // Sparse ambient particles: a small <canvas> (not SVG — a
        // handful of soft-edged circles redrawn per frame costs far less
        // than another feTurbulence/feDisplacementMap graph). Spawn
        // anywhere in the canvas area rather than anchored to the orb's
        // own edge, and drift with a slowly wandering heading rather
        // than a fixed outward vector — anchoring spawn to the edge with
        // a straight radial drift read as the orb visibly "emitting"
        // motes, confirmed live, not the quiet ambient dust intended.
        const MAX_PARTICLES = 4;
        const particles = [];

        function spawnParticle() {
          const margin = CANVAS_SIZE * 0.08;
          particles.push({
            x: margin + Math.random() * (CANVAS_SIZE - margin * 2),
            y: margin + Math.random() * (CANVAS_SIZE - margin * 2),
            angle: Math.random() * Math.PI * 2,
            size: 1.2 + Math.random() * 1.3,
            hue: baseHues[Math.floor(Math.random() * baseHues.length)],
            bornAt: performance.now(),
            lifespan: 6000 + Math.random() * 4000,
          });
        }

        let nextSpawnAt = performance.now() + 1000 + Math.random() * 2000;

        function drawParticles() {
          const now = performance.now();
          if (particles.length < MAX_PARTICLES && now > nextSpawnAt) {
            spawnParticle();
            nextSpawnAt = now + 1500 + Math.random() * 3000;
          }
          ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const age = now - p.bornAt;
            if (age > p.lifespan) { particles.splice(i, 1); continue; }
            // Heading wanders instead of holding a fixed direction, so
            // the path reads as loose, aimless dust rather than a
            // straight flight — verified with a standalone simulation
            // (net-displacement / path-length ratio), not just eyeballed:
            // a 0.15 rad/tick wander rate (tried first) still produced a
            // ~0.95 ratio, i.e. still basically a straight line, over a
            // realistic tick count. 0.9 rad/tick gets that down to
            // ~0.33-0.43, genuinely non-straight. The constant nudge
            // keeps a slight overall upward/leftward tendency (embers
            // rising) on top of the wander; it has to stay well below
            // the wander step's own magnitude (~0.025) or it dominates
            // and flattens the path back toward a straight line, which
            // is exactly what a first attempt at this (-0.01/-0.025) did.
            p.angle += (Math.random() - 0.5) * 0.9;
            p.x += Math.cos(p.angle) * 0.025 - 0.002;
            p.y += Math.sin(p.angle) * 0.025 - 0.004;
            const lifeFrac = age / p.lifespan;
            const opacity = lifeFrac < 0.25 ? lifeFrac / 0.25 : lifeFrac > 0.75 ? (1 - lifeFrac) / 0.25 : 1;
            const hue = hueFor(p.hue);
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, `hsla(${hue}, 75%, 72%, ${(opacity * 0.3).toFixed(2)})`);
            grad.addColorStop(1, `hsla(${hue}, 75%, 72%, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Runs on rAF only while there's actually something to animate
        // (active particles, or a spawn imminent) and the orb is
        // on-screen; otherwise sleeps via setTimeout until close to the
        // next spawn instead of polling every single frame for nothing
        // to do.
        function tickParticles() {
          if (!orbVisible) {
            setTimeout(tickParticles, 400);
            return;
          }
          const now = performance.now();
          if (particles.length === 0 && now < nextSpawnAt - 200) {
            setTimeout(tickParticles, Math.min(nextSpawnAt - now, 2000));
            return;
          }
          drawParticles();
          requestAnimationFrame(tickParticles);
        }
        tickParticles();
      }
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
      // before.
      //
      // Deliberately re-spread a second time so magnitudes read as
      // genuinely varied across a page rather than clustering at two
      // poles (near-zero vs. near-max, which is what a purely
      // clearance-driven derivation naturally produces, since only two
      // real constraints exist — "needs real clearance" or "doesn't").
      // Direction is still set by real geometry (right-aligned elements
      // still lean left, left-aligned still lean small/rightward), but
      // within the "needs real clearance" group, only one waypoint per
      // page is pushed toward the solved maximum ("decisive") — the
      // rest deliberately stop at "medium," short of what full clearance
      // would ask for, trading some additional accepted overlap (beyond
      // what the size increase above already added) for a path that
      // doesn't read as two fixed extremes alternating. Work's and
      // Life's lone "decisive" waypoint (their only real-clearance one)
      // already couldn't fully clear even at the old -0.98 ceiling on a
      // short 2-section page — that residual is now simply larger, on
      // the same accepted terms as Home's Contact always was: covered by
      // the z-index fallback, not a live guarantee.
      // Work and Life each have only one waypoint that needs real
      // clearance at all (their lone right-aligned element) — softening
      // it toward "medium" the way Home's two and About's two are
      // softened relative to each other buys no variety within the
      // page (there's no second big-lean moment to contrast it
      // against), it just adds overlap for nothing. Kept close to the
      // solved maximum here instead; the varied-magnitude goal is
      // satisfied across pages (this "decisive" reads differently from
      // Home's/About's own, softer ones) rather than within these two.
      const WAYPOINT_PLANS = {
        home: [0.06, -0.85, 0.16, -0.45, 0.22],
        work: [0.14, -0.92],
        about: [0.06, -0.70, 0.18, -0.45],
        life: [0.10, -0.92],
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
          // Mirrors the .sphere CSS rule's own width/height (min(580px,
          // 20vw)) exactly — if the two ever diverge, this is reasoning
          // about a size the orb doesn't actually render at.
          const baseWidth = baseOrbWidth();
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
            const lean = Math.max(-0.98, Math.min(0.25, (leans[i] ?? -0.2) + jitter[i].lean));
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
        const baseWidth = baseOrbWidth();
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
