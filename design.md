# OFF+BRAND. — Style Reference
> Iridescent sphere on warm parchment

**Theme:** light

OFF+BRAND. operates as a typographic architecture on warm parchment: a near-monochrome canvas (#e5e4e0) where a single custom geometric sans-serif (Ataero Retina OB) carries nearly all the expressive weight. Headlines are monumentally large (up to 103px) with tight line-height (0.80) and whisper-wide tracking, while a singular iridescent gradient sphere — yellow bleeding into pink, then blue, then dissolving into white — anchors the hero as the only chromatic event on an otherwise achromatic page. Interfaces should feel like an editorial spread: thin concentric circle ornaments, a precise 2×5 client logo grid, grid-paper project cards, and label text that tracks wide like museum signage. There are no shadows, no fills, no buttons heavier than a ghost link with a 10px radius — restraint is the entire design language.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Parchment | `#e5e4e0` | `--color-parchment` | Page canvas, section backgrounds — warm off-white that replaces pure white, making the page feel like printed stock rather than a screen |
| Ink | `#1d1d1d` | `--color-ink` | Primary text, heading strokes, link borders, all dark UI elements — near-black with zero blue cast, reading as editorial print |
| Paper | `#ffffff` | `--color-paper` | Elevated card surfaces, logo container backgrounds, project card canvases — pure white to lift content above the warm parchment |
| Ash | `#bfbebe` | `--color-ash` | Hairline borders, subtle dividers, structural outlines that need to recede against the parchment |
| Stone | `#cdcdc9` | `--color-stone` | Mid-tone surface between parchment and white — secondary panel background when a layer needs quiet separation |
| Iridescent Sphere | `linear-gradient(255deg, rgb(250, 203, 14), rgb(240, 107, 168) 30%, rgb(120, 186, 230) 65%, rgb(255, 255, 255))` | `--color-iridescent-sphere` | Signature gradient object in the hero — the only chromatic element, flowing from saturated yellow through hot pink to cool blue before dissolving to white. Functions as a brand beacon, not a UI color |

## Tokens — Typography

### Ataero Retina OB Edition — Sole typeface across the entire system. A custom geometric sans-serif with tall x-height and generous counters. Weight 400 serves body and display alike; weight 700 is reserved for small labels and navigation. Display sizes (70–103px) use 0.80 line-height to stack headline lines into a single typographic block. The font's distinctive openness and slight humanist warmth is the brand's primary identity signal — no fallback font family should appear on a production page · `--font-ataero-retina-ob-edition`
- **Substitute:** Neue Haas Grotesk Display, Inter (tight tracking), or Suisse Int'l — none match exactly; the custom font is non-negotiable for brand recognition
- **Weights:** 400, 700
- **Sizes:** 11, 15, 18, 34, 46, 70, 76, 103
- **Line height:** 0.80, 1.00, 1.40
- **Letter spacing:** 0.0060em, 0.0130em, 0.0170em, 0.0500em
- **Role:** Sole typeface across the entire system. A custom geometric sans-serif with tall x-height and generous counters. Weight 400 serves body and display alike; weight 700 is reserved for small labels and navigation. Display sizes (70–103px) use 0.80 line-height to stack headline lines into a single typographic block. The font's distinctive openness and slight humanist warmth is the brand's primary identity signal — no fallback font family should appear on a production page

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 11px | 1.4 | 0.55px | `--text-caption` |
| body-sm | 15px | 1.4 | 0.15px | `--text-body-sm` |
| body | 18px | 1.4 | 0.23px | `--text-body` |
| subheading | 34px | 1 | 0.44px | `--text-subheading` |
| heading-sm | 46px | 1 | 0.6px | `--text-heading-sm` |
| heading | 70px | 0.8 | 0.91px | `--text-heading` |
| heading-lg | 76px | 0.8 | 0.99px | `--text-heading-lg` |
| display | 103px | 0.8 | 1.34px | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 4px

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 5 | 5px | `--spacing-5` |
| 6 | 6px | `--spacing-6` |
| 8 | 8px | `--spacing-8` |
| 15 | 15px | `--spacing-15` |
| 19 | 19px | `--spacing-19` |
| 30 | 30px | `--spacing-30` |
| 32 | 32px | `--spacing-32` |
| 46 | 46px | `--spacing-46` |
| 76 | 76px | `--spacing-76` |
| 119 | 119px | `--spacing-119` |

### Border Radius

| Element | Value |
|---------|-------|
| cards | 0px |
| links | 10px |
| inputs | 10px |
| buttons | 10px |

### Layout

- **Page max-width:** 1400px
- **Section gap:** 76-119px
- **Card padding:** 30px
- **Element gap:** 19px
- **Zigzag gap:** 740px (`--zigzag-gap`) — the gap before every `.zigzag` section after the first. Well above the normal 76–119px section-gap range, but not for the weave's sake (the S-curve adapts to whatever room it's given): it's a hard floor equal to the orb's own worst-case grown-and-breathed diameter at the widest width this site is verified at (1700px: baseWidth 306px × `BASE_GROWTH_PLATEAU` × `BREATHE_SAFETY_FACTOR` ≈ 700px), so its fixed vertical band can never simultaneously touch two consecutive zigzag elements' text at once — verified via `getBoundingClientRect()` sweeps, not assumed (see Scroll-Linked Orb). The safety solver there is what actually guarantees no overlap even in the rare case this floor isn't enough; the gap just keeps that case rare.
- **Page edge right:** `--page-edge-right`, `calc(max(0px, (100vw - 1400px) / 2) + 30px)` — distance from the viewport's right edge to `.page`'s own right content edge at any width, used to keep the fixed-position orb aligned without duplicating this math in JS

## Tokens — Motion

Motion is restrained the same way color is: a small, fixed vocabulary reused everywhere rather than one-off durations and curves per component. Everything animated — entrances, hovers, scroll reveals, the hero sphere's ambient drift — pulls from this set.

### Duration Scale

| Name | Value | Token | Role |
|------|-------|-------|------|
| fast | 150ms | `--duration-fast` | Micro-interactions — hover states, arrow nudges, pill scale |
| base | 300ms | `--duration-base` | Standard transitions — nav underline, link fades, entrance fades |
| slow | 600ms | `--duration-slow` | Emphasis moments — hero clip-path reveal, scroll-triggered card rise |
| orb | 48s | `--duration-orb` | Ambient loop — the hero sphere's continuous hue drift |

### Easing

| Name | Value | Token | Role |
|------|-------|-------|------|
| standard | `cubic-bezier(0.4, 0, 0.2, 1)` | `--ease-standard` | The system's sole easing curve — used on every timed transition and animation, entrances included |

### Stagger

| Name | Value | Token | Role |
|------|-------|-------|------|
| stagger step | 75ms | `--stagger-step` | Offset between successive elements in an orchestrated sequence (hero entrance, staggered skill tags) |

### Cursor Interaction

| Name | Value | Token | Role |
|------|-------|-------|------|
| orb follow distance | 14px | `--orb-follow-distance` | Max drift of the hero sphere toward the cursor — restrained, never a full follow |
| orb follow lerp | 0.08 | `--orb-follow-lerp` | Per-frame smoothing factor (0–1) that makes the sphere trail the cursor instead of snapping to it |
| orb follow radius | 1.5× orb diameter | *(inline in motion.js)* | Proximity radius around the orb's own current position within which cursor-follow pulls toward it — measured from the orb itself (not the page-top `.orb-frame` box) so the effect keeps working while mid-scroll, when the orb's fixed viewport position and its parent element's document position have long since diverged |
| weave lerp | 0.12 | *(inline in motion.js, `WEAVE_LERP`)* | Per-frame smoothing factor for the scroll-linked orb's S-curve x-position and breathing scale — same mechanism as orb follow lerp, tuned slightly faster |
| breathe amplitude | 0.35 | *(inline in motion.js, `BREATHE_AMPLITUDE`)* | Max scale swing (±) for the scroll-linked orb's "breathing" — grows in open space, shrinks near text |
| weave intro distance | 60px | *(inline in motion.js, `WEAVE_INTRO_DISTANCE`)* | Scroll distance over which the S-curve weave fades in from dead-center at the very top of a page — short and fixed, not tied to the header's height, so it's always done fading before the safety clamp (never faded) needs to engage |
| base growth plateau | 1.65 | *(inline in motion.js, `BASE_GROWTH_PLATEAU`)* | The orb's depth-based base size (independent of breathing) once fully grown — up from the receded 0.65 floor, past its original 1, to a noticeably larger resting size. Combined with breathe amplitude at its widest-open moments, this is what gets the orb to roughly a third of the viewport width at its largest |
| growth level fraction | 0.6 | *(inline in motion.js, `GROWTH_LEVEL_FRACTION`)* | How far into a page's real content (as a fraction of the distance from the header's end to the last content) the depth-growth above finishes — short of 1 so it's flat well before the footer, on every page regardless of length |
| viewport bleed fraction | 0.6 | *(inline in motion.js, `VIEWPORT_BLEED_FRACTION`)* | How far the orb's center may sit past the viewport edge, as a fraction of its own half-width, before the safety solver below treats it as the binding constraint instead of the text |
| organic scale headroom | 0.04 | *(inline in motion.js, `ORGANIC_SCALE_HEADROOM`)* | Extra safety-margin allowance reserved for the organic scale wobble below, folded into `BREATHE_SAFETY_FACTOR` rather than the render-time cap since the wobble is applied after that cap |
| organic drift amplitude | 0.07× / 0.045× baseWidth | *(inline in motion.js, `organicAmpX`/`organicAmpY`)* | Peak x/y offset of the scroll-linked orb's continuous, time-driven idle wobble (see Scroll-Linked Orb) — proportional to the orb's own current size, not a flat px amount |
| organic drift periods | ~35–140s | *(inline in motion.js, `tickScrollOrb`)* | Periods of the four sine terms (two per axis) summed to produce the wobble — slow and mutually unrelated so the combined path doesn't read as a simple back-and-forth |
| magnetic radius | 70px | `--magnetic-radius` | Proximity radius around a magnetic element within which it begins pulling toward the cursor |
| magnetic strength | 0.3 | `--magnetic-strength` | Max fraction (0–1) of cursor offset applied as pull — closer cursor = stronger pull, capped here |
| spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `--ease-spring` | Snap-back curve for magnetic elements releasing the cursor — the system's one eased-with-overshoot curve, reserved for this release moment only |

## Components

### Hero Gradient Sphere
**Role:** Signature brand visual — the only chromatic element on the site

A large, deliberately dominant circular form — same `.sphere` element and exact natural size on every page (`min(520px, 18vw)`, viewport-relative rather than a flat px cap, so it stays proportional from a narrow window up to a wide desktop one), only its position differs: bled above/right of the Home hero (anchored near the same corner as the concentric rings — see Concentric Circle Ornament, though at this size it now reads as a field the rings sit inside of rather than a same-scale companion shape), sitting flush inside the page column on Work/About/Life. Between the header-scroll recede, the scroll-depth growth, and breathing (see Scroll-Linked Orb), the rendered diameter ranges from roughly a fifth of the viewport width at rest up to close to a third at its largest — large enough that it's expected and intentional for it to bleed behind the display headline and page-header `h1`, which stay legible on top only because they carry `position: relative; z-index: 1` (the sphere itself is `z-index: 0`); it is never allowed to overlap actual body copy, ghost-links, or the meta-list, which is a hard, measured guarantee (see Scroll-Linked Orb), not a z-index accident. `.page-header` is sized tall enough (`min-height: 360px`) to hold the full circle with no `overflow: hidden` anywhere, so the orb is never cropped on any page. Filled with the iridescent gradient (yellow → pink → blue → white at 255deg). No border, no shadow. Shares `view-transition-name: hero-orb` across every page so cross-document navigation treats it as one persistent, independently-travelling element rather than cross-fading it as part of the root snapshot (see Orb-Led Page Transition) — its width/height are never overridden per page (only position is), verified via `getBoundingClientRect()` rather than assumed, so that travel is always a pure move, never a resize. Outside of a transition, it carries four simultaneous, independent motion layers, all optional and independently gated: a barely-perceptible ambient hue drift (`--duration-orb`, linear, continuous, on unless reduced motion); on fine-pointer devices only, a restrained cursor-follow drift (`--orb-follow-distance`, `--orb-follow-lerp`) that trails the pointer rather than snapping to it, on whichever page the cursor is over; on every page, a scroll-linked persistence that weaves with the zigzag alternation below it (see Scroll-Linked Orb); and, also on every page, a slow organic idle wobble layered underneath all of the above so the orb never sits perfectly still or traces a perfectly straight/predictable path (see Scroll-Linked Orb). Never a spin, never a hard follow, never anything attention-grabbing — the organic wobble in particular is meant to read as barely-conscious ambient life, not as its own visible "effect."

### Zigzag Section Alternation
**Role:** Gives every page a left-right-left-right rhythm as you scroll, and gives the scroll-linked orb something to weave between

Every repeating content unit — Home's `#now`/`#contact`, Work's `.project-card`, About/Life's `.about-block` — carries `.zigzag`. `.zigzag:nth-of-type(even)` flips to a right-aligned block (`display: flex; flex-direction: column; align-items: flex-end` — each child shrinks to its own content width and hugs the right edge; text within each item stays left-aligned per the "body copy never centers" rule, only the block's position changes). `.zigzag + .zigzag` carries `--zigzag-gap` (740px) as its `margin-top` — sized for the orb's own safety floor (see Scroll-Linked Orb), not for pacing. It's taller than earlier iterations of this token because the orb's depth-based growth means its worst-case footprint is now much bigger than a fixed-size orb's; the gap only has to clear that footprint at the widest width this site is verified at (1700px), the actual overlap guarantee is the solver in motion.js, not this number. Any child element meant to size to its own content rather than stretch full-width (see `.meta-list`) must actually do so (`inline-flex`, not `flex`) for this alignment — and for `motion.js`'s edge-safety measurement against it — to be correct.

Two right-aligned About blocks ("How I Got Here", "Closing") also carry `.about-block--narrow` (`max-width: 28ch` on their `p` elements), independent of the gap sizing above. At common desktop widths their default-width paragraphs reached far enough left to demand an outsized, fast-looking orb swing to clear them (a real, measured ~750px lean at 1100px width) even with the gap generous; narrowing them directly is the content-level fix for that specific case, not something spacing or the orb's own math should have to compensate for.

### Scroll-Linked Orb
**Role:** Keeps the hero orb present on every page while scrolling instead of scrolling away with the hero/page-header, weaving toward whichever side the current zigzag section's text sits on rather than receding in a straight vertical line

On every page, and only absent reduced motion, `.orb-frame .sphere` switches to `position: fixed`, anchored at a resting spot set per context via `--orb-rest-top`/`--orb-rest-right` (declared on `.hero` and `.page-header` respectively) — Home's ring-aligned bleed, Work/About/Life's flush page-column spot — reproducing each context's own absolute-mode position at scroll 0 (so there's no jump at load), and using `--page-edge-right` (a shared `calc()` mirroring `.page`'s own max-width centering math) rather than a flat px offset, since a static value drifts out of alignment once the viewport exceeds 1400px + padding. A continuous `requestAnimationFrame` tick (running every frame while unreduced, the same pattern as the cursor-follow orb, rather than only reacting to `scroll`/`resize` events) tracks progress against the hero/page-header's own height for a recede-only `--scroll-scale` component (1 toward ~0.65) and `--scroll-y` (a slight upward drift), and separately drives `--scroll-x` — the S-curve weave.

Past the header, `--scroll-scale`'s base keeps changing: it grows back up from that receded 0.65 through the main content, leveling off at `BASE_GROWTH_PLATEAU` (1.65) at `GROWTH_LEVEL_FRACTION` (0.6) of the way from the header's end to the page's own last real content — measured per page, not a fixed pixel distance, so every page levels off well before its own footer regardless of how long its content runs. Breathing (below) still applies on top of this depth-based base, not instead of it, so the orb's size at any instant is "how deep down the page" times "how much open space is nearby" times "the current organic scale wobble" — three independent signals compounding, not one.

For each `.zigzag` element currently under the viewport's vertical center, the orb's *preferred* horizontal target is computed against that element's own real content edges (`Range.getClientRects()` for h2/p, since a text block's own box reports its max-width cap or container edge rather than where the glyphs actually end; `getBoundingClientRect()` for already content-sized pieces like `.ghost-link`/`.meta-list`/`.contact-placeholder`): right-aligned elements now occupy the orb's own resting corner, so clearing them is a hard, measured requirement; left-aligned elements never conflict with that corner, so the orb only leans partway toward them for the weave. Bracketing is done by each element's own top/bottom edges, not just its center — holding the exact target for an element's entire visible span and blending only across the genuinely empty gap after it, since a center-to-center blend would start easing toward the next (laxer) target the instant it passes the midpoint, potentially relaxing a still-visible right-aligned element's safety clearance early. This preference only fades in over `WEAVE_INTRO_DISTANCE` (60px of scroll) at the very top of a page, so the orb starts dead-center in the rings at load rather than already leaning toward whatever the first section happens to want — deliberately a short, fixed distance rather than tracking the header's own (much taller) height, for reasons the next paragraph covers.

That preferred value is then run through a solver (`safetyBaseAt()` plus the half-width algebra around it in `tickScrollOrb`), not a simple clamp, because depth-growth means a single "safe half-width" doesn't always exist. Which `.zigzag` elements even count is decided from the orb's own *desired* band — `restTop + drift` down to that plus `baseWidth × depthBase × BREATHE_SAFETY_FACTOR` — never from its actual current rendered rect. That distinction matters: an earlier version read the live rect, which fed back into itself — shrinking the orb to dodge one element shrank its band, which stopped detecting that same element as nearby, which let the orb grow back, which re-triggered the shrink — an oscillation that never settled. Sizing the detection band off the fixed "how big would this orb like to be" value instead keeps the relevant-elements set stable frame to frame, however much the actual render ends up shrinking to fit them.

Given that set, the solver finds the largest half-width consistent with every active bound at once: clearing a left-aligned element's margin, clearing a right-aligned one's, keeping both simultaneously satisfiable if both are active (rare — see the `--zigzag-gap` note above), and staying within `VIEWPORT_BLEED_FRACTION` of the viewport's own edges (a text-safety bound can still demand more room than even a generous bleed allows once a paragraph is wide relative to a narrow window — an orb that's clear of the text but invisible off-screen isn't actually safe either). That solved half-width becomes both the bound used to clamp `--scroll-x` and a cap on the actual rendered size (see the breathing paragraph below) — what's on screen always matches what the safety math assumed, rather than the render quietly exceeding it. If even the smallest sane half-width can't satisfy every bound — content genuinely too tight for any orb size, which does happen at some narrow-viewport/deep-scroll combinations — the solver gives up on the viewport-bleed preference first and targets the active text bound(s) exactly; violating "stay comfortably on screen" is the acceptable failure mode here, violating "never overlap text" is not.

This whole solve is intentionally never faded by scroll position the way the preference above is: it's a measurement of where the orb's real, currently-rendered band physically is, so faking it out would mean claiming safety it doesn't have. An earlier version *did* fade both together (sharing one `progress` value tied to the header's height), which is exactly what caused a reported backtrack in the S-curve — once a section's text got close enough to need clamping, the clamp would yank the still-fading-in preference straight to full strength in a single frame. Decoupling them, with the short fixed `WEAVE_INTRO_DISTANCE` above standing in for the old fade, is what fixed it.

The solved value is a *raw*, this-instant target, and it can still jump between frames — a new element entering or leaving the orb's band, or the anchor/blend handing off between sections. `--scroll-x` doesn't render that raw value directly: the *deliberate* part of the position (scroll/weave/cursor-follow, kept as its own `deliberateWeaveX`) is lerped toward it every frame (`--orb-follow-lerp`'s own 0.08, reused here as `WEAVE_LERP` at 0.12 — same mechanism as the cursor-follow orb, tuned slightly faster so the weave still reads as scroll-linked rather than trailing), which is what turns any such jump into a continuous glide instead of a visible snap or backtrack. Because the lerp is chasing a target that can itself have just tightened, that deliberate value gets one hard clamp against *this* frame's own solved bounds — the smoothing can lag toward a stale target for a frame or two, but this stays never outside the currently-solved-safe range, and it's what's carried into next frame's lerp (see the organic drift paragraph below for why the wobble is deliberately kept out of this persisted state).

Organic drift rides on top of that already-safe deliberate position, not inside it: two summed sine terms per axis, at slow, mutually unrelated periods (roughly 35–140s), continuously time-driven (`performance.now()`) rather than derived from scroll or cursor state at all — so the orb never sits perfectly still or traces a perfectly predictable path, the way a lava lamp never quite repeats itself. It's added to `deliberateWeaveX` and the *combined* value is what actually gets clamped into this frame's bounds and rendered — deliberately not fed back into the persisted `currentWeaveX` used for next frame's lerp, since a continuously-wobbling value would mean the lerp spent every frame chasing its own noise instead of the real scroll/weave target, damping the very drift it's supposed to preserve. A matching scale wobble (two more sine terms, ±2.5%/±1.5%) rides on top of the already-capped breathing scale the same way, covered by `ORGANIC_SCALE_HEADROOM`'s extra margin in `BREATHE_SAFETY_FACTOR` so it can't itself push the render past what the clearance math upstream assumed. Amplitudes scale with the orb's own current `baseWidth` rather than a flat px amount, so the wobble reads as proportionally the same restlessness whether the orb is small or at its largest.

The same weave value also drives a "breathing" resize: near its natural resting center (small weave offset) the orb reads as being in open space and grows up to +35%; leaning hard toward a text block, it shrinks up to -35% — a swing meant to be clearly visible while scrolling at a normal pace, not just on a before/after screenshot. It's tied to the same value driving the S-curve and lerped by the same `WEAVE_LERP`, so size and position move and settle as one motion rather than two competing effects. Because that resize is computed *from* the weave position, which is itself computed *against* the orb's own half-width, the edge-safety math throughout uses a conservative, worst-case-breathed half-width (`× 1.39` — `BREATHE_SAFETY_FACTOR`, i.e. 1 + breathe amplitude + organic scale headroom — rather than resolving the circular dependency exactly), so the real, possibly-smaller size is always at least as safe. When the solver above has had to shrink the orb to fit a tight spot, that same lerp additionally caps the breathing target so the actual render never exceeds the solved half-width either — a visible "squeeze through the gap" that settles back out once the constraint clears.

Opacity fades to 0 only in the genuine final stretch before the footer: `--scroll-opacity` holds at 1 until every `.zigzag` element's bottom edge has scrolled past (a fixed fraction of viewport height alone isn't enough — it doesn't know how long the actual content is, and can clip into a page's last section once it's short enough), then fades over the smaller of half a viewport height or the real remaining distance to the footer. On a page short enough that the footer and the last section are simultaneously on screen once either is reachable, it stays fully opaque for the entire scroll — correct under the "never fade over visible content" rule, even though it means no visible fade at all on that particular page.

Under reduced motion, `.orb-frame .sphere` falls back to the plain absolute, non-fixed rule — no scroll-tracking transform, no weave, no breathing, on any page.

### Orb-Led Page Transition
**Role:** A two-part transition where the orb visibly travels its own path between pages while the content underneath simply fades — deliberately two motions of different character, not one flat slide

Site-wide `@view-transition { navigation: auto; }` opts every page into cross-document view transitions. The orb (`view-transition-name: hero-orb`, see Hero Gradient Sphere) gets the browser's default `::view-transition-group(hero-orb)` position interpolation, but retimed onto `--duration-slow` with `--ease-spring`'s overshoot rather than the default linear ease — long and lively enough that the straight-line interpolation reads as a deliberate, "alive" travel rather than a flat morph, and starts at `animation-delay: 0` so it's already moving by the time anything else happens. The rest of the page (`::view-transition-old(root)`/`::view-transition-new(root)`) is a plain cross-fade — the browser's own default fade keyframes, just retimed onto the shorter, quieter `--duration-base`/`--ease-standard` with a `60ms` delay, so it visibly starts after the orb and never competes with it for attention. Unsupported browsers ignore the at-rule and the property entirely and fall back to a normal, instant navigation — no feature-detection script needed, since that fallback is CSS's own forward-compatible parsing behavior. `prefers-reduced-motion: reduce` zeroes out both the delay and the duration on every view-transition pseudo-element, collapsing the whole thing to a near-instant cut.

### Display Headline
**Role:** Primary typographic statement — the page's main expressive element

Ataero Retina OB, weight 400, 70–103px, line-height 0.80, letter-spacing ~0.013em. Ink (#1d1d1d) on Parchment (#e5e4e0). All caps. Lines stack tightly to form a single typographic block. Can span full viewport width. No text shadow, no gradient, no decoration. Sized with `clamp()` for fluid scaling across breakpoints rather than fixed sizes that jump. On the home hero, reveals via a clip-path wipe rather than a plain fade.

### Ghost Text Link
**Role:** Primary interactive element — replaces the conventional button

Ataero Retina OB, 15px, weight 400, Ink (#1d1d1d) text. No background fill. 10px border-radius on the hit area. Often accompanied by a small arrow glyph (→). Padding 5px vertical, 0 horizontal. Underline or arrow reveals affordance on hover. This is the only clickable element style in the system. Hover transitions (fill, arrow nudge) use `--duration-base` and `--ease-standard`. On fine-pointer devices, ghost links and nav items are also magnetic: within `--magnetic-radius` of the cursor they pull toward it (scaled by `--magnetic-strength`), releasing with `--ease-spring` when the cursor moves away. Falls back to the plain hover states with no pointer or under reduced motion.

### Section Label
**Role:** Micro-typography for section identification — museum-signage style

Ataero Retina OB, 11px, weight 400, Ink (#1d1d1d), all caps, letter-spacing 0.05em. Aligned left, sits above section content with generous vertical space. Functions as a quiet navigational cue, not a heading.

### Client Logo Cell
**Role:** Logo grid unit within the 'Trusted by Leaders' section

Pure white (#ffffff) rectangular cell, no border, no shadow, no padding inside. Logos sit centered at ~60% width in Ink (#1d1d1d) or their own brand color. Arranged in a 2-row × 5-column grid with thin Ash (#bfbebe) hairline dividers (1px) between cells. The grid itself is the design — cells are austere.

### Featured Work Card
**Role:** Project showcase tile with grid-paper background

White (#ffffff) surface with a subtle dot-grid or line-grid pattern overlay (light gray, ~#e5e4e0 lines on white). Large project title in Ataero Retina OB 46px weight 400 Ink. No border, no shadow, no radius. Image or render sits below title. Functions as a printable editorial layout tile. Enters the viewport with a scroll-triggered rise + fade (`--duration-slow`, `--ease-standard`, ~20–30px translate) rather than appearing on load.

### Concentric Circle Ornament
**Role:** Decorative structural element — subtle page-level geometry

Thin Ash (#bfbebe) or Ink-at-20%-opacity circular outlines, 1px stroke, positioned as background elements. Often 2–3 concentric rings at different radii, anchored to a focal point (sphere, headline, or viewport center). Never filled, never animated. Adds architectural depth without color.

### Scroll Indicator
**Role:** Bottom-right navigation prompt on the hero

Ataero Retina OB, 11px, weight 400, all caps, letter-spacing 0.05em, Ink. Text reads 'SCROLL' with a downward arrow. Fixed position, bottom-right with 30px inset. Minimal, editorial, disappears once user scrolls.

### Founder Intro Block
**Role:** Two-column intro section with label + body copy

Left column: Section label ('WE ARE A FOUNDER-LED...') in 15px uppercase, weight 400, Ink, with 'ABOUT US →' ghost link below. Right column: body copy in 18px, line-height 1.40, weight 400, Ink. Column gap 19px. Sits on Parchment canvas with generous 76px vertical padding above and below.

### All Work Filter Button
**Role:** Secondary navigation element for portfolio filtering

Pill-shaped ghost button: Ink border 1px, 10px radius, padding 8px 19px. Ataero Retina OB 11px, weight 400, all caps, letter-spacing 0.05em, Ink text. Arrow glyph (→) at right. Hover: fill becomes Ink, text becomes Parchment. This is the only state-change button in the system.

## Do's and Don'ts

### Do
- Use #e5e4e0 as the exclusive page canvas — never substitute pure #ffffff or gray at the page level
- Set display headlines at 70–103px in Ataero Retina OB weight 400 with line-height 0.80 to create stacked typographic blocks
- Apply the iridescent sphere gradient (255deg, yellow → pink → blue → white) as a hero anchor, never as a button fill, border, or small accent
- Use 10px border-radius on all interactive elements (links, buttons, inputs) — 0px radius on all card surfaces
- Set section labels at 11px with letter-spacing 0.05em and all-caps — this tracking is a brand signature, not a style choice
- Separate sections with 76–119px vertical margins and use Ash (#bfbebe) 1px hairlines for structural dividers, never colored lines
- Maintain the monochrome discipline: if a screen needs more than the parchment/ink/white/ash palette, reassess the design before adding color
- Pull every animation duration and curve from the Motion tokens (`--duration-*`, `--ease-standard`, `--stagger-step`) instead of one-off values
- Respect `prefers-reduced-motion: reduce` on every animation — drop the transform, keep a near-instant fade
- Gate cursor-reactive motion (orb follow, magnetic elements) behind `(hover: hover) and (pointer: fine)` — these effects don't exist on touch
- Drive per-frame cursor-follow position updates with `requestAnimationFrame`, never directly in a raw `mousemove`/`pointermove` handler

### Don't
- Do not introduce a second typeface family — Ataero Retina OB is the sole voice
- Do not use colored fills on buttons, cards, or backgrounds — all interactive surfaces stay ghost or white
- Do not add drop shadows, box-shadows, or elevation effects — the system is flat by design philosophy
- Do not use the gradient outside the hero sphere context — it is a single signature moment, not a recurring accent
- Do not set body text below 15px or above 18px — the 15/18 pair is the readable range in this system
- Do not center-align body paragraphs — body copy reads left-aligned, always
- Do not round card or image containers — cards are sharp-cornered (0px); only interactive elements get 10px radius
- Do not let the hero sphere's ambient motion read as a spin or attention-grabbing effect — it stays barely perceptible
- Do not let the cursor-follow orb or magnetic elements snap directly to the pointer — always ease/lerp, and cap the travel distance

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Parchment Canvas | `#e5e4e0` | Base page background — warm off-white, sets the editorial print tone. Content sections (`<section>` and everything inside — the Now/Contact/project-card/about-block content) sit directly on this level site-wide, no elevated card box beneath them |
| 1 | Paper | `#ffffff` | Reserved for logo container surfaces if/when a client logo grid is added — not currently used for content sections |
| 2 | Stone Panel | `#cdcdc9` | Mid-tone secondary surface for sections needing quiet structural separation |

## Elevation

The system is intentionally shadowless. Depth is communicated through surface color shifts (Parchment → Paper → Stone) and through the layered placement of decorative elements (concentric circles, gradient sphere) behind text. A shadow appearing on any element would break the editorial print metaphor — the design is flat, like ink on paper.

## Imagery

Imagery is restrained and product-focused. The hero features one large iridescent gradient sphere (not photography, not illustration — a pure CSS gradient form). Below the fold, project cards use product renders and screenshots on white backgrounds with grid-paper overlays. Client logos are flat monochrome marks in their own brand colors, contained within white cells. There is no lifestyle photography, no abstract illustration, no stock imagery. The visual language is: one gradient object as hero, then sharp product visuals on white for case studies.

## Layout

Full-viewport hero with centered/left-aligned display text overlapping a large gradient sphere positioned right-of-center. Generous vertical breathing room: 76–119px between sections. Content blocks are left-aligned with asymmetric weight — large text left, supporting copy right. Client logos arranged in a strict 2×5 grid with hairline dividers. Project cards appear as large rectangular tiles with grid-pattern backgrounds. The page rhythm is: full-bleed hero → text-forward intro section → logo grid → featured work grid. No sidebar, no sticky navigation, no footer-heavy structure — navigation is minimal top-bar or absent, and the scroll indicator is the primary affordance. The concentric circle ornaments repeat across sections to create spatial continuity without section dividers.

## Agent Prompt Guide

**Quick Color Reference**
- Text: #1d1d1d
- Background: #e5e4e0 (Parchment)
- Elevated surface: #ffffff
- Border: #bfbebe
- Accent: iridescent gradient sphere only (linear-gradient(255deg, rgb(250, 203, 14), rgb(240, 107, 168) 30%, rgb(120, 186, 230) 65%, rgb(255, 255, 255)))
- primary action: no distinct CTA color

**Example Component Prompts**
1. **Display Headline**: 103px Ataero Retina OB weight 400, line-height 0.80, letter-spacing 1.34px, #1d1d1d on #e5e4e0 canvas. All caps. Stacks into a 3-line typographic block.

2. **Ghost Text Link**: 15px Ataero Retina OB weight 400, #1d1d1d, no fill, 10px border-radius on hit area, trailing → arrow. 5px vertical padding. Underline on hover.

3. **Section Label**: 11px Ataero Retina OB weight 400, #1d1d1d, all caps, letter-spacing 0.55px, left-aligned. 76px space below before body content begins.

4. **Client Logo Cell**: White (#ffffff) rectangle, 0px radius, no border, no shadow. Logo centered at 60% width in #1d1d1d. Arranged in 2 rows × 5 columns with 1px #bfbebe hairlines between cells.

5. **Hero Gradient Sphere**: 600px circle, linear-gradient(255deg, #facb00, #f06ba8 30%, #78bae6 65%, #ffffff), positioned right-of-center, partially behind display headline. No border, no shadow, sits as background layer. Hue drifts continuously and almost imperceptibly over `--duration-orb`.

## Gradient System

The iridescent sphere gradient is a singleton, not a system. It appears exactly once on any given page — full-bleed and bled off-edge in the Home hero, sitting flush within the page column elsewhere, never cropped either way — as the same `.sphere` element at the same size, and never repeats as a button gradient, section background, or general-purpose accent. Its presence on Work/About/Life exists so the same brand beacon carries through the site (and rides along in the directional page swipe — see Directional Page Swipe), not as a recurring decorative accent. The 255deg angle is fixed: yellow (rgb 250,203,14) at the top-right, pink (rgb 240,107,168) at 30%, blue (rgb 120,186,230) at 65%, dissolving to white at the end. This is the only color event in an otherwise achromatic system; treating it as a reusable token would dilute its impact.

## Typography Voice

Ataero Retina OB Edition is a custom font — not available on Google Fonts or Adobe Fonts. For prototypes and mockups, the closest open substitute is Inter at tight tracking, but production pages must license the original. The font's character: tall x-height, geometric construction with subtle humanist warmth in the terminals, generous counters. At display sizes (70–103px) it reads as architectural; at body sizes (15–18px) it reads as editorial print. The 0.80 line-height on display sizes is unconventional — most systems use 1.0–1.2 — but here it allows headlines to stack into a single visual mass rather than airy separate lines.

## Similar Brands

- **Active Theory** — Same iridescent gradient hero sphere anchored to large display typography on a warm neutral canvas
- **Resn** — Monochrome editorial layout with oversized custom sans-serif display type and near-zero color palette
- **Locomotive (locomotive.ca)** — Warm off-white canvas with sharp 0px-radius cards, grid-line decorative patterns, and typographic-first hierarchy
- **Bureau Cool** — Achromatic agency site using one large chromatic object (gradient or illustration) as the sole color moment against warm white
- **Pentagram** — Editorial print sensibility applied to web — large display type, hairline dividers, grid-paper project cards, ghost navigation links

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-parchment: #e5e4e0;
  --color-ink: #1d1d1d;
  --color-paper: #ffffff;
  --color-ash: #bfbebe;
  --color-stone: #cdcdc9;
  --color-iridescent-sphere: #facb00;
  --gradient-iridescent-sphere: linear-gradient(255deg, rgb(250, 203, 14), rgb(240, 107, 168) 30%, rgb(120, 186, 230) 65%, rgb(255, 255, 255));

  /* Typography — Font Families */
  --font-ataero-retina-ob-edition: 'Ataero Retina OB Edition', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 11px;
  --leading-caption: 1.4;
  --tracking-caption: 0.55px;
  --text-body-sm: 15px;
  --leading-body-sm: 1.4;
  --tracking-body-sm: 0.15px;
  --text-body: 18px;
  --leading-body: 1.4;
  --tracking-body: 0.23px;
  --text-subheading: 34px;
  --leading-subheading: 1;
  --tracking-subheading: 0.44px;
  --text-heading-sm: 46px;
  --leading-heading-sm: 1;
  --tracking-heading-sm: 0.6px;
  --text-heading: 70px;
  --leading-heading: 0.8;
  --tracking-heading: 0.91px;
  --text-heading-lg: 76px;
  --leading-heading-lg: 0.8;
  --tracking-heading-lg: 0.99px;
  --text-display: 103px;
  --leading-display: 0.8;
  --tracking-display: 1.34px;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-bold: 700;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-5: 5px;
  --spacing-6: 6px;
  --spacing-8: 8px;
  --spacing-15: 15px;
  --spacing-19: 19px;
  --spacing-30: 30px;
  --spacing-32: 32px;
  --spacing-46: 46px;
  --spacing-76: 76px;
  --spacing-119: 119px;

  /* Layout */
  --page-max-width: 1400px;
  --section-gap: 76-119px;
  --card-padding: 30px;
  --element-gap: 19px;
  --zigzag-gap: 740px;
  --page-edge-right: calc(max(0px, (100vw - 1400px) / 2) + 30px);

  /* Border Radius */
  --radius-md: 6.47619px;
  --radius-lg: 9.52381px;
  --radius-3xl: 30.4762px;

  /* Named Radii */
  --radius-cards: 0px;
  --radius-links: 10px;
  --radius-inputs: 10px;
  --radius-buttons: 10px;

  /* Surfaces */
  --surface-parchment-canvas: #e5e4e0;
  --surface-paper: #ffffff;
  --surface-stone-panel: #cdcdc9;

  /* Motion — Duration */
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 600ms;
  --duration-orb: 48s;

  /* Motion — Easing */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Motion — Stagger */
  --stagger-step: 75ms;

  /* Motion — Cursor Interaction */
  --orb-follow-distance: 14px;
  --orb-follow-lerp: 0.08;
  --magnetic-radius: 70px;
  --magnetic-strength: 0.3;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-parchment: #e5e4e0;
  --color-ink: #1d1d1d;
  --color-paper: #ffffff;
  --color-ash: #bfbebe;
  --color-stone: #cdcdc9;
  --color-iridescent-sphere: #facb00;

  /* Typography */
  --font-ataero-retina-ob-edition: 'Ataero Retina OB Edition', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 11px;
  --leading-caption: 1.4;
  --tracking-caption: 0.55px;
  --text-body-sm: 15px;
  --leading-body-sm: 1.4;
  --tracking-body-sm: 0.15px;
  --text-body: 18px;
  --leading-body: 1.4;
  --tracking-body: 0.23px;
  --text-subheading: 34px;
  --leading-subheading: 1;
  --tracking-subheading: 0.44px;
  --text-heading-sm: 46px;
  --leading-heading-sm: 1;
  --tracking-heading-sm: 0.6px;
  --text-heading: 70px;
  --leading-heading: 0.8;
  --tracking-heading: 0.91px;
  --text-heading-lg: 76px;
  --leading-heading-lg: 0.8;
  --tracking-heading-lg: 0.99px;
  --text-display: 103px;
  --leading-display: 0.8;
  --tracking-display: 1.34px;

  /* Spacing */
  --spacing-5: 5px;
  --spacing-6: 6px;
  --spacing-8: 8px;
  --spacing-15: 15px;
  --spacing-19: 19px;
  --spacing-30: 30px;
  --spacing-32: 32px;
  --spacing-46: 46px;
  --spacing-76: 76px;
  --spacing-119: 119px;

  /* Border Radius */
  --radius-md: 6.47619px;
  --radius-lg: 9.52381px;
  --radius-3xl: 30.4762px;

  /* Motion — Duration */
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 600ms;
  --duration-orb: 48s;

  /* Motion — Easing */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Motion — Stagger */
  --stagger-step: 75ms;

  /* Motion — Cursor Interaction */
  --orb-follow-distance: 14px;
  --orb-follow-lerp: 0.08;
  --magnetic-radius: 70px;
  --magnetic-strength: 0.3;
}
```
