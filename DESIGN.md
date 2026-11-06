---
name: NanoAgriSense
description: Precision IoT soil telemetry and closed-loop automated fertigation system
colors:
  primary: "#4c7a3a"
  primary-dark: "#2f4f22"
  primary-light: "#e4ecd8"
  primary-mist: "#b7d19c"
  secondary: "#1f7fa0"
  secondary-track: "#d9edf4"
  tertiary-ochre: "#a97a2b"
  tertiary-ochre-track: "#f1e6cc"
  alert-rust: "#a8472e"
  alert-rust-track: "#f1ded2"
  neutral-bg: "#f6f2da"
  neutral-bg-deep: "#efe9c9"
  neutral-surface: "#fffdf3"
  neutral-surface-pure: "#ffffff"
  neutral-ink: "#2c2a1e"
  neutral-ink-soft: "#5c5a48"
  neutral-border: "#d8d0a4"
typography:
  display:
    fontFamily: "'Inter', sans-serif"
    fontSize: "1.9rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Inter', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "'Inter', sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "'Inter', sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Inter', sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    letterSpacing: "0.04em"
rounded:
  sm: "10px"
  md: "16px"
  lg: "22px"
  xl: "28px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "11px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  button-valve-close:
    backgroundColor: "{colors.alert-rust}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "11px 20px"
  card:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  nav-pill:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 8px"
---

# Design System: NanoAgriSense

## Overview

**Creative North Star: "The Botanical Field Ledger"**

NanoAgriSense balances the tactile discipline of an agricultural researcher's notebook with the functional immediacy of an industrial control room. Grounded in organic parchment, botanical pigments, and deep charcoal ink outlines, the interface communicates high-density scientific telemetry without ever lapsing into sterile, generic software templates. Every surface feels deliberate, physical, and calibrated for operators working under field daylight as well as academic evaluators auditing machine learning decisions.

The design language pairs warm, earth-derived substrates with high-contrast structural borders and measured tonal fills. Rather than relying on arbitrary floating cards or synthetic blur effects, information is partitioned into clear, bordered panels, segmented tables, and distinct status tiers. Physical actuators, fuzzy logic outputs, and real-time telemetry streams take center stage with high scannability and unambiguous tactile controls.

**Key Characteristics:**
- **Sunlit Earth Substrates:** Warm parchment canvas (`#f6f2da`) with a subtle 22px botanical micro-dot grid.
- **Physical Ink Outlines:** Crisp, confident `2px` and `2.5px` charcoal ink borders (`#2c2a1e`) that anchor every interactive surface.
- **Natural Botanical Accents:** Leaf canopy greens, irrigation cyan, harvest ochre, and terracotta rust replacing synthetic UI neons.
- **Soft Layered Tonal Depth:** Gentle tonal layering with quiet, selective offset shadows for elevated dialogs and focus states.
- **Mission-Critical Clarity:** Three-tiered alert hierarchy and unmistakable binary feedback for pumps, solenoid valves, and power status.

## Colors

The palette is rooted in agricultural field reality: living crop canopies, rich humus soil, fresh irrigation water, and mineral fertilizers.

### Primary
- **Leaf Canopy** (`#4c7a3a`): Primary brand mark, active navigation indicators, operational success states, and confirmed manual actuation.
- **Deep Foliage** (`#2f4f22`): Section headers, hover states on primary buttons, and high-emphasis agricultural labels.
- **Sprout Mist** (`#e4ecd8`): Gentle tinted background for table alternating rows and light interactive hover feedback.
- **Sage Field** (`#b7d19c`): Grounding tint for physical sensor node cards and secondary telemetry modules.

### Secondary
- **Irrigation Cyan** (`#1f7fa0`): Water telemetry indicators, live transmission pulses, CO₂ metrics, and active irrigation flow.
- **Water Track** (`#d9edf4`): Soft background tint for moisture indicators, active normal pills, and log notifications.

### Tertiary
- **Harvest Ochre** (`#a97a2b`): NPK nutrient readings, electrical conductivity (EC), system warning tier badges, and power-saving indicators.
- **Ochre Track** (`#f1e6cc`): Gentle background wash for nutrient metrics and cautionary alert cards.
- **Terracotta Rust** (`#a8472e`): Critical thresholds, emergency close valve commands, low-battery alerts, and unread notification counter.
- **Terracotta Track** (`#f1ded2`): Urgent alert background wash, indicating out-of-bounds soil conditions or system dropouts.

### Neutral
- **Sunlit Parchment** (`#f6f2da`): Global body canvas and main panel backdrop.
- **Deep Cream** (`#efe9c9`): Substrate border accent and secondary panel fills.
- **Field Paper** (`#fffdf3`): Elevated card and greeting container background, providing clean contrast against the parchment base.
- **Pure White** (`#ffffff`): Data-dense live feed table canvas and sensor chart surface.
- **Charcoal Ink** (`#2c2a1e`): Structural borders, headings, body copy, and high-contrast icon outlines.
- **Soft Ink** (`#5c5a48`): Secondary metadata, timestamps, table column headers, and axis labels.
- **Straw Border** (`#d8d0a4`): Subtle dividers, inactive chart dots, and nested card borders.

### Named Rules
**The Natural Pigment Rule.** Synthetic saturated neons (hot magenta, electric blue, radioactive green) are strictly prohibited. Every color in the system must represent an observable agricultural truth: canopy leaf, river water, fertile loam, sun-cured crop, or dry terracotta clay.

**The Alert Rarity Rule.** Terracotta Rust (`#a8472e`) is reserved strictly for actionable critical conditions requiring human intervention or automated cutoff. It is never used for decorative accents or neutral badges.

## Typography

**Display Font:** Inter, -apple-system, BlinkMacSystemFont, sans-serif  
**Body Font:** Inter, -apple-system, BlinkMacSystemFont, sans-serif  
**Label/Mono Font:** Inter, monospace (with `letter-spacing: 0.02em` for telemetry numbers)

**Character:** Utilitarian, crisp, and highly legible across both high-resolution desktop monitors and mobile screens in bright sunlight. Dense numbers and unit labels align cleanly in tabular formats.

### Hierarchy
- **Display** (Bold 700, `clamp(1.5rem, 3vw, 1.9rem)`, line-height `1.2`): Greeting titles and main operator headlines.
- **Headline** (Bold 700, `1.25rem`, line-height `1.3`): Container titles, table titles, visual panel headings, and modal titles.
- **Title** (SemiBold 600, `1.05rem`, line-height `1.4`): Node names, section headers, and field cluster labels.
- **Body** (Regular 400 / Medium 500, `0.95rem`, line-height `1.5`): Status summaries, instruction text, and telemetry readout descriptions.
- **Label** (Bold 700 / ExtraBold 800, `0.72rem – 0.78rem`, uppercase, `letter-spacing: 0.04em`): Notification tier headers, node badges, metric captions, and table column headers.

### Named Rules
**The Explicit Units Rule.** Every telemetry reading must display its physical scientific unit (`ppm CO₂`, `pH`, `% VWC`, `mg/kg NPK`, `°C`, `V`, `dBm`) in secondary soft ink directly adjacent to the numerical value. Numbers are never presented bare.

## Layout

The layout uses a responsive desktop-first container model that gracefully drops into stacked single-column layouts for mobile field operators.

- **Global Shell:** Centered container with `max-width: 1280px`, horizontal gutter of `clamp(20px, 5vw, 64px)`.
- **Main Enclosure:** Enclosed `.panel` container with a distinct `2.5px solid var(--ink)` perimeter and `28px` border radius.
- **Top Split Grid:** Two-column desktop grid (`1.05fr` left column / `0.95fr` right visual panel) with `24px` gutter, collapsing to `1fr` below `900px`.
- **Metrics Breakdown Grid:** 5-column grid for soil parameters (Moisture, Temp, EC, pH, NPK), scaling down to 3 columns at `1080px`, 2 columns at `720px`, and 1 column at `480px`. Air metrics (CO₂) utilize a specialized full-width card format.
- **Rhythm & Spacing:** Multiples of 4px and 8px (standard margins: 8px, 16px, 22px, 28px).

## Elevation & Depth

NanoAgriSense employs a **Soft Layered Tonal** elevation model with physical ink outlines. Surfaces gain visual priority through purposeful background color shifts (parchment `#f6f2da` → field paper `#fffdf3` → tinted status tracks) rather than heavy drop shadows.

### Shadow Vocabulary
- **Panel Drop** (`box-shadow: 6px 7px 0 rgba(44,42,30,0.9)`): Used exclusively on the floating notification drawer and greeting card to give structural tactile weight.
- **Button Offset** (`box-shadow: 3px 4px 0 rgba(44,42,30,0.35)`): Used on carousel navigation buttons (`.chart-nav`) for tactile physical affordance.
- **Toggle Thumb** (`box-shadow: 0 2px 5px rgba(0,0,0,0.18)`): Used on segmented sliding toggle switches (Node filter).
- **Substrate Grid** (`radial-gradient`): Background radial micro-dot grid giving depth to the parchment canvas without creating visual noise.

### Named Rules
**The Flat Canvas Rule.** Internal dashboard containers and cards remain flat at rest with `2px` ink borders. Hard drop shadows are reserved for floating menus, dialogs, and primary greeting blocks.

## Shapes

The form language combines generous exterior rounding with structured internal rectangular geometry.

- **Main Panel Enclosure:** `28px` radius (`--radius-xl`) framing the entire application view.
- **Primary Cards & Containers:** `22px` radius (`--radius-lg`) for major visual groups, greeting cards, and notification panels.
- **Secondary Containers & Tables:** `16px` radius (`--radius-md`) for table wraps, control cards, and KPI modules.
- **Sensor Cards:** `14px` radius for nested node and reservoir metric cards.
- **Buttons & Valve Controls:** `10px` radius for tactile square-corner physical pushbuttons.
- **Badges, Pills & Navigation:** `999px` full pill radius for navigation tabs, status chips, and transmission interval indicators.
- **Icon Controls & Avatars:** `50%` circular radius for bell button, fullscreen toggle, brand logo, and dot indicators.

## Components

### Buttons & Actuators
- **Primary Action / Auto Toggle ON:** Solid Leaf Canopy (`#4c7a3a`) fill, pure white text, `2px solid var(--ink)` border, `10px` radius, padding `11px 20px`. Hover deepens to `#2f4f22`.
- **Toggle OFF / Default Button:** Sunlit Parchment (`#f6f2da`) fill, Charcoal Ink (`#2c2a1e`) text, `2px solid var(--ink)` border. Hover shifts to Sprout Mist (`#e4ecd8`).
- **Emergency / Close Valve Button:** Solid Terracotta Rust (`#a8472e`) fill, white text, `2px solid var(--ink)` border.
- **Circular Icon Button:** `50%` circle, `42px` diameter (or `32px` for table tools), `2px solid var(--ink)`, Field Paper (`#fffdf3`) background. Hover shifts to `var(--leaf-light)`.

### Navigation Pill
- **Container:** Segmented floating pill with `2px solid var(--ink)` border, Sunlit Parchment (`#f6f2da`) background, `999px` radius, and `6px 8px` padding.
- **Active Tab:** Leaf Canopy (`#4c7a3a`) fill with white text.
- **Expanding Tab:** Smooth `max-width` transition (`92px` to `340px`) revealing full system title ("Irrigation System and Nutrient Control Center") on hover.
- **Logout Link:** Placed on far right with Terracotta Rust text and hover wash.

### Cards & Metrics Containers
- **Soil KPI Card:** Field Paper (`#fffdf3`) background, `2px solid var(--ink)` border, `16px` radius, padding `18px 20px`. Color-tinted variant backgrounds (`.kpi-moisture`, `.kpi-temp`, `.kpi-ph`, `.kpi-npk`) provide instant metric recognition.
- **Membership Level Track:** Segmented fuzzy logic bar (`6px` height, `999px` radius) with dynamic color fills matching fuzzy classification (Teal for low, Violet for medium, Leaf for optimal).

### Live Sensor Feed Table
- **Header:** Sticky top header with white background, `2px solid var(--ink)` bottom border, bold semi-caps headers.
- **Rows:** Alternating zebra striping with Sprout Mist (`var(--leaf-light)`). High-density monospace sensor readings.
- **Status Pills:** Pill-shaped chips (`padding: 4px 10px`, `999px` radius) with semantic color combinations:
  - Optimal / Normal: Water Track (`#d9edf4`) + Irrigation Cyan (`#1f7fa0`)
  - Watch / Warning: Ochre Track (`#f1e6cc`) + Harvest Ochre (`#a97a2b`)
  - Action / Alert: Terracotta Track (`#f1ded2`) + Terracotta Rust (`#a8472e`)

### Tiered Notification Drawer
- **Drawer:** Floating card positioned below bell button, `380px` width, `2.5px solid var(--ink)` border, `22px` radius, `6px 7px 0 rgba(44,42,30,0.9)` offset shadow.
- **Tiers:** Three distinct sections (Critical Alerts, System Warnings, Operational Logs) distinguished by color-coded dot badges, count pills, and left border indicator strips.

## Do's and Don'ts

### Do:
- **Do** maintain the 2px/2.5px solid charcoal ink border across all interactive cards and panels.
- **Do** anchor every telemetry readout with explicit scientific measurement units (`%`, `ppm`, `mg/kg`, `°C`).
- **Do** use alternating row fills (`#e4ecd8`) on dense data tables to preserve scanning accuracy in field conditions.
- **Do** show active hardware states (valves, pumps, power) with dual confirmation: color badge AND explicit textual state ("OPEN", "CLOSED", "RUNNING", "IDLE").
- **Do** preserve the warm parchment canvas (`#f6f2da`) and botanical dot matrix pattern as the bedrock of the visual environment.

### Don't:
- **Don't** introduce generic cool-slate or corporate blue backgrounds (`#f8fafc`, `#1e293b`).
- **Don't** use diffuse fuzzy CSS drop shadows (`box-shadow: 0 10px 30px rgba(0,0,0,0.1)`); keep depth tonal and outlines physical.
- **Don't** use neon warning reds or high-saturation alert banners; rely on Terracotta Rust (`#a8472e`).
- **Don't** hide critical Sugeno fuzzy inference or solenoid actuation reasons behind nested menus; keep autonomous actions transparent.
- **Don't** omit touch-friendly padding: all mobile interactive elements must maintain at least 44×44px hit targets.
