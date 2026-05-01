# HyperFit — Design System

## Memorable thing

> "I can see whether I'm actually improving."

Every visual decision serves this. The app is a mirror, not a hype machine — it shows trajectory honestly so the user keeps coming back to the gym.

## Direction

**Strava × Robinhood hybrid** ("the honest mirror"). Strava's bold orange-led hero treats each session as an event. Robinhood's data art turns trajectory into a primary visual element — sparklines, deltas, the volume number itself becomes the thing you watch.

Inspirations: Strava (bold orange, photographic energy), Robinhood (green/red deltas, sparklines, big numbers as hero), Whoop (dark data-rich), Nike Run Club (set rendering as big numerics).

## Surfaces — visual specs

### GymView (active session)

1. **Hero block** (top, ~200pt tall):
   - Radial orange gradient from top-left + radial green gradient from bottom-right + linear bottom-fade to bg
   - Live volume curve (SVG polyline, 60% opacity) baked into the gradient as session-trajectory-so-far
   - Eyebrow label: `● LIVE · LEG DAY` in orange caps, 0.22em letter-spacing
   - Session name: 30px / weight 900 / -0.03em letter-spacing — "Squats Day"
   - Volume readout: `14,250` at 32px / weight 800 / `tnum` numerics
   - Delta: `▲ +1,180` in `accent.sessionUp` (green) followed by `vs last leg day` in `text.tertiary`

2. **Active exercise card** — your reference spec:
   - Top row: exercise name in 22px / 900 / uppercase + `PR TRY` chip in `accent.lift` orange
   - Last-session rule (between hairlines, padding 12pt): `LAST` label in `text.quaternary` 11px caps + dot-separated values (`225·5 · 245·5 · 245·5 · 250·3`) in `text.secondary` 13px tabular-nums + delta on the right (`+5` in `accent.lift` 14px / 800 when today is heavier; `text.quaternary` when matching; `accent.regression` when lighter)
   - 4-column set grid: 22px / 900 numerics, 1px dividers between columns, 9px caps label below each (`SET 1 / SET 2 / LIVE / SET 4`)
     - `done`: `text.primary` at 50% opacity
     - `live`: `accent.lift` orange (both number and label)
     - `pending`: `text.disabled`

3. **Compact next-exercise rows** — name + last-rule only, sets render after user starts that exercise

4. **Rest dock** (absolute-positioned, bottom + 76pt): glass-blur backdrop, "REST · NEXT 250 × 5" label + 22px tabular timer

5. **Bottom nav**: 5 tabs with proper SVG iconography (TRAIN / PLANS / HISTORY / SCHEDULE / ME), active tab in `accent.lift` orange, glass blur backdrop

### History

- Top: per-row dense layout (no big cards)
- Each row: `MMM DD` date in mono caps + session name + total volume in mono tabular + 8-session inline sparkline + trend dot (`accent.sessionUp` / `text.quaternary` / `accent.regression`)
- Heatmap stays but uses per-muscle volume gradient in `accent.sessionUp` ramp instead of the current rainbow

### Plans Library

- Plan cards on `palette.surface` with `palette.borderStrong` 1px outline (no glass)
- Title in 16px / weight 600
- Metadata row: `3X/WEEK · GYM · 12 WEEKS` in 11px mono caps `text.quaternary`
- Status badges as terminal-style mono labels (not pills): `● ACTIVE` (orange), `PUBLISHED` (green), `○ UNDER REVIEW` (gray), `[OFFICIAL]` (gray)
- Active plan: 2px `accent.lift` orange left-border (the ONLY orange element on the screen)

## Tokens

See `src/styles/theme.ts` for the canonical export. Summary:

### Color

| Role | Hex | Token |
|------|-----|-------|
| App background | `#0a0a0a` | `palette.bg` |
| Hero radial-orange tint | `#1a0f0a` | `palette.bgHeroTint` |
| Surface | `#18181b` | `palette.surface` |
| Surface elevated | `#27272a` | `palette.surfaceAlt` |
| Border subtle | `#18181b` | `palette.borderSubtle` |
| Border strong | `#27272a` | `palette.borderStrong` |
| Text primary | `#ffffff` | `text.primary` |
| Text secondary | `#d4d4d8` | `text.secondary` |
| Text tertiary | `#a1a1aa` | `text.tertiary` |
| Text quaternary (labels) | `#71717a` | `text.quaternary` |
| Text disabled | `#3f3f46` | `text.disabled` |
| Lift active / PR / lift-delta | `#fc4c02` | `accent.lift` |
| Session volume up | `#00d68f` | `accent.sessionUp` |
| Regression | `#ef4444` | `accent.regression` |

**Color is signal, not decoration.** Orange and green are used sparingly. If everything glows, glow stops meaning anything.

### Typography

- **Family:** `System` (SF Pro on iOS, Roboto on Android). Loading Inter via `expo-font` is a follow-up.
- **Numerics:** every numeric `Text` component must set `fontVariant={['tabular-nums']}`. Helper exported as `fonts.tabularNums`.
- **Weights used:** 400 / 500 / 600 / 700 / 800 / 900. Hero session names = 900. Exercise card titles = 900 uppercase. Stat readouts = 800. Body = 500.

### Spacing

Existing scale (xs/sm/md/lg/xl/xxl) preserved. Extended scale exported as `space` for dense data layouts:

```
2xs=2  xs=4  2sm=6  sm=8  md=12  lg=16  xl=24  2xl=32  3xl=40  4xl=56  5xl=64
```

### Radii

Hierarchical: chips/badges `sm` (6), inputs `md` (10), cards `lg` (14), modals `xl` (20).

### Shadows

- `shadows.card`: subtle, used on elevated surfaces
- `shadows.glow`: orange glow at 45% opacity / 16pt blur — for the active set + new-PR moments only

### Gradients

- `gradients.primary`: orange linear (used for buttons, the orange tint in the hero)
- `gradients.heroFade`: transparent → bg (used to fade the hero into the exercise list)
- `gradients.glassOverlay`: dark glass overlay for blur backdrops

## Motion

- Numbers count up on PR (~300ms ease-out)
- Rest timer pulse: kept (functional)
- Drop spring bounces on screen transitions
- No card-entry stagger animations

## Decoration rules

1. Glass blur is allowed but at lower intensity (~20-30, was ~80). Used on the rest dock + bottom nav, where context-separation matters. Removed from per-exercise cards.
2. The hero gradient is the only place the app uses radial gradients. Everywhere else: solid surfaces with hairline borders.
3. PR chips, +delta labels, and active-set highlights are the only places `accent.lift` orange appears in the active session.

## Per-component conventions

- Use `text.*` for all `Text` color values. No more `colors.muted` vs `colors.mutedAlt` confusion.
- Use `accent.*` for signal colors. No hardcoded `#fc4c02` or `#00d68f` in components.
- Set `fontVariant={fonts.tabularNums}` on every numeric `Text`. This is non-negotiable — it's the difference between columns lining up and not.
- Borders between rows: `palette.borderSubtle` at 1px. Borders around cards: `palette.borderStrong` at 1px.

## Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-01 | "Honest mirror" direction (D from /design-consultation) | User picked Strava + Robinhood vibe; serves the "I can see if I'm improving" job-to-be-done |
| 2026-05-01 | Nike-style 4-column set grid for the active exercise card | User screenshotted the rendering they wanted; clear, informative, scannable in 0.4s |
| 2026-05-01 | Orange = lift-level delta, green = session-level delta | Two distinct signals at two scales — lift-set vs whole-session |
| 2026-05-01 | Cyan accent retired | User feedback: cyan added noise without earning it |
| 2026-05-01 | Inter loading deferred | System font ships immediately; expo-font can come later |
