---
name: BaghBaan AI
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#414941'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#717970'
  outline-variant: '#c1c9be'
  surface-tint: '#3a6844'
  primary: '#164525'
  on-primary: '#ffffff'
  primary-container: '#2f5d3a'
  on-primary-container: '#a1d4a8'
  inverse-primary: '#a0d3a7'
  secondary: '#006d37'
  on-secondary: '#ffffff'
  secondary-container: '#7bf8a1'
  on-secondary-container: '#007239'
  tertiary: '#7f0403'
  on-tertiary: '#ffffff'
  tertiary-container: '#a12218'
  on-tertiary-container: '#ffb6ab'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bbefc1'
  primary-fixed-dim: '#a0d3a7'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#22502e'
  secondary-fixed: '#7efba4'
  secondary-fixed-dim: '#61de8a'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005228'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#410000'
  on-tertiary-fixed-variant: '#8e130c'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md-medium:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1rem
  margin-tablet: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies an organic yet technologically disciplined aesthetic tailored for apple orchardists and field agronomists working outdoors in the Kashmir Valley. 

The emotional tone balances agrarian stewardship with clinical AI diagnostic confidence. It delivers clarity under direct outdoor sunlight, tactile trust for users wearing work gloves or operating one-handed on uneven terrain, and a serene visual connection to lush orchard landscapes.

### Style Archetype: Organic High-Contrast Minimal
- **Visual Stance:** Calm, authoritative, and direct. The interface strips decorative artifice in favor of generous breathing room, high-contrast typography, and tactile affordances.
- **Motif & Texture:** Subtle biological contours reminiscent of leaf venation and terraced orchards, expressed solely through structural rhythm, curved surface cards, and crisp micro-accents rather than intrusive graphic noise.
- **Interaction Ethos:** High situational awareness. One primary action per view, voice/camera-first input paths, oversized touch targets (48px to 56px standard), and unambiguous diagnostic signals.

## Colors

The palette directly mirrors the natural environment of an apple orchard while maintaining rigorous sunlight visibility (APCA-compliant, exceeding WCAG AAA for key readability tiers).

### Primary Palette & Roles
- **Primary Brand (`#2F5D3A`):** Deep Orchard Green. Used for primary CTAs, main interactive surfaces, and key navigation identifiers. Imparts authority and deep botanical roots.
- **Healthy Accent (`#27AE60`):** Vibrant Leaf Green. Reserved strictly for positive diagnostic feedback (healthy foliage status, verified checks, completed scan states).
- **Critical Accent (`#C0392B`):** Apple Red. High-salience indicator reserved for severe pathology alerts (e.g., Apple Scab, Fire Blight), destructive actions, and critical notifications.
- **Warning Accent (`#D68910`):** Kashmir Amber. Signals low diagnostic confidence, poor lighting warnings during capture, or moderate foliar stress alerts.

### Neutral Canvas & Surfaces
- **App Canvas (`#FAF8F3`):** Warm Sunlight Off-White. Absorbs glare outdoors and softens optical fatigue compared to harsh digital white.
- **Card Surface (`#FFFFFF`):** Pure White. Elevates focal cards, diagnostic summaries, and interactive groupings.
- **Subdued Surface (`#F4F0E8`):** Muted sand tint for card nesting, input wells, and segmented controls.
- **Border Outline (`#EDE7DC`):** Tactile boundary stroke ensuring crisp visual separation under sunlight glare.

### Text Hierarchy
- **Text Primary (`#1A2E20`):** Deep Forest Charcoal. Provides maximum contrast against `#FFFFFF` and `#FAF8F3`.
- **Text Muted (`#57685D`):** Balanced lichen green for secondary metadata, timestamps, and descriptive hints. Ensures clear readability without overpowering header hierarchy.

## Typography

Typography prioritizes rapid recognition in dynamic outdoor field conditions:
- **Headings (`Plus Jakarta Sans`):** Selected for its clear, geometric construction, open counters, and sturdy x-height, delivering an accessible, approachable feel identical in structural utility to Poppins while enhancing legibility.
- **Body & Labels (`Inter`):** Systematic and neutral with optimized tall x-height, square terminal geometry, and wide apertures that prevent letter-blurring in bright glare.
- **Strict Size Threshold:** Body text never drops below 16px for critical agricultural instructions, diagnostic steps, or field notes. Secondary metadata is kept above 12px.

## Layout & Spacing

A mobile-first fluid layout configured for single-thumb navigation and rapid scanning during active orchard walk-throughs:

- **Touch Surface Geometry:** All interactive components enforce an absolute minimum target of 48×48px, with high-priority primary actions expanding to 56px height.
- **Content Rhythm:** Content cards stack vertically using `space-md` (16px) or `space-lg` (24px) spacing, preventing information crowding and ensuring unambiguous touch boundaries.
- **Edge Containment:** Outer screen margins hold at 16px (`1rem`) on standard hand-held devices to maximize usable screen real estate for diagnostic camera framing and imagery review while insulating from accidental palm touches along bezel edges.

## Elevation & Depth

Visual hierarchy employs gentle ambient illumination combined with structural hairline outlines to preserve card visibility even when sunlight washes out deep drop shadows.

- **Base Ambient Shadow:** Layered cards feature a diffused warm-tinted shadow (`box-shadow: 0 4px 16px -2px rgba(26, 46, 32, 0.06), 0 2px 6px -1px rgba(26, 46, 32, 0.04)`).
- **Physical Outlines:** Every card combines ambient shadow with an explicit `1px solid #EDE7DC` stroke. Under intense direct glare where shadow falloff becomes invisible, the stroke defines the card envelope.
- **Elevated Modals & Floating Trays:** Scan viewfinders, diagnosis sheet draws, and quick-action bottom sheets use higher elevation (`box-shadow: 0 12px 32px -4px rgba(26, 46, 32, 0.14)`) combined with backdrop filters (`backdrop-filter: blur(12px)` over 80% opacity off-white).

## Shapes

The interface embraces a unified 16px radius (`rounded-lg`) across all core content cards, camera capture viewfinders, and modal dialogs. 

- **Cards & Sheets:** Fixed at 16px (`1rem`) for smooth corner flow that feels organic without wasting valuable corner content area.
- **Buttons & Control Inputs:** 12px to 14px radius for internal buttons, ensuring cohesive nested geometry within 16px cards.
- **Status Chips & Pills:** Full pill radius (`rounded-full` / 9999px) for disease severity badges, quick filter tags, and operational mode selectors.

## Components

### Buttons
- **Primary CTA:** Minimum height 56px, background `#2F5D3A`, text `#FFFFFF`, font `Inter` 16px Semibold. Accompanied by prominent 24px icons on the leading edge. Focus/active state triggers deep tint `#23472C`.
- **Secondary Action:** Minimum height 48px, surface `#FFFFFF`, border `1.5px solid #2F5D3A`, text `#2F5D3A`.
- **Destructive/Critical Action:** Background `#C0392B`, text `#FFFFFF`, border-radius 12px. Used for severe disease emergency quarantine logs or data removal.

### Status Badges & Chips
- **Healthy / Clear:** Background `#E8F8F0`, border `1px solid #27AE60`, text `#1A6337`, icon `CheckCircle`.
- **High Risk / Infection Detected:** Background `#FDEDEC`, border `1px solid #C0392B`, text `#922B21`, icon `AlertTriangle`.
- **Low Confidence / Advisory:** Background `#FEF9E7`, border `1px solid #D68910`, text `#9A630B`, icon `HelpCircle`.
- **Geometry:** Height 32px to 36px, internal padding `0 12px`, rounded pill (`rounded-full`).

### Cards & Diagnosis Feed
- **Diagnostic Result Card:** Surface `#FFFFFF`, border `1px solid #EDE7DC`, border-radius 16px, padding 20px. Features split layout: leaf preview thumbnail (80×80px, 12px radius) paired with pathology title, confidence gauge, and recommended fungicide/management chip.
- **Field Metric Widget:** Surface `#F4F0E8`, border-radius 16px, padding 16px. High-contrast scalar value paired with plain-language status (e.g., "94% Orchard Health Score").

### Inputs & Camera Controls
- **Text & Dropdown Inputs:** Minimum height 52px, background `#FFFFFF`, border `1.5px solid #EDE7DC`, font 16px. Focused state uses `#2F5D3A` border with a 3px soft green outer glow (`rgba(47, 93, 58, 0.15)`).
- **Scan Shutter Button:** Sits centered in navigation. 64×64px floating circular button with `#2F5D3A` fill, surrounded by a 4px `#FFFFFF` halo and ambient elevation, accompanied by clear haptic vibration feedback.

### Bottom Navigation Bar
- **Structure:** 5 destinations: Home, Scan (Elevated Center CTA), History, Library, Settings.
- **Height & Spacing:** 68px height above device safe area. Icons are 24px accompanied by 12px Medium text labels. Active state displays `#2F5D3A` with a small 4px circular organic green indicator above the active item; inactive items rest at `#57685D`.