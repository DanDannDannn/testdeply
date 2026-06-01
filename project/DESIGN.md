# DESIGN.md

Context and constraints for Claude Design when generating visuals, prototypes, and screens for Forward Earth's Supply Chain Carbon Footprint (SCCF) product. Attach to every Claude Design project.

## Product context

Forward Earth is a carbon compliance and transparency platform.
SCCF covers Scope 3 emissions accounting, focus on Category 1 (purchased goods and services).
Primary users: sustainability analysts and supply chain managers (daily), CSOs and procurement leads (weekly or less).
Core job: upload spend or activity data, match line items to emission factors (EFs), review totals, hotspots, drivers, and supplier breakdowns, export for reporting.
Benchmarks to meet or beat: Watershed, Persefoni, Sweep, Plan A, CarbonChain.

## Visual system

Fill the bracketed values with your real design tokens. Everything else is a default that applies across the product.

### Color

Brand primary: [HEX]
Brand secondary: [HEX]
Neutrals: 9-step scale from near-white to near-black, use 2-3 shades per screen, avoid pure black.
Semantic: success [HEX], warning [HEX], error [HEX], info [HEX].

Emissions palette (consistent across the product):
Scope 1: [HEX]
Scope 2: [HEX]
Scope 3: [HEX]
Sequential intensity scale: light to dark, 5 stops, for heatmaps and hotspot views.
Diverging palette: only for variance vs baseline or target, never for categorical encoding.
Estimated vs measured: hatched fill or icon tag, never a separate hue that competes with scope colors.

### Typography

Display: [Font], sizes 32 / 24 / 20.
Body: [Font], sizes 16 / 14 / 12.
Numeric in tables: tabular or monospace figures so columns align.
Line height: 1.4 for body, 1.2 for display.

### Spacing

Base unit 4px. Scale: 4, 8, 12, 16, 24, 32, 48, 64.
Card padding 16-24. Section gap 32-48.

### Iconography

Style: outlined, 1.5px stroke. Sizes 16 / 20 / 24.
Library: [Phosphor / Lucide / Forward Earth custom].

## Layout patterns

Page shell: left rail nav, top bar with breadcrumb and primary actions, main canvas, optional right drawer for filters or record detail.
Dashboard: KPI row at top (headline number, unit, period, trend indicator). Primary chart below. Secondary context chart. Data table at bottom.
List view: sticky filters at top, dense table, row action on hover, bulk action bar when rows selected.
Detail view: summary header with key metrics, tabbed sections for calculation breakdown, provenance, activity log.

## Data table defaults

Row height 40px, 32px compact, 48px comfortable.
Numeric columns right-aligned with tabular figures.
Sticky header and first column.
Sortable columns with clear direction indicator.
Filter row or filter drawer.
Hover row highlight, not zebra stripes.
Keyboard nav cell to cell, shift-arrow to range-select.
Copy-as-CSV available from any table.

## Data visualization rules

Units (kgCO2e or tCO2e) visible on chart, not just page title.
Time period visible on chart.
Y-axis starts at 0 for bars and areas.
Direct labeling preferred over legends when there are 5 or fewer series.
High data-ink ratio, minimal gridlines, no 3D, no drop shadows.
Consistent scope colors across every view.
Sequential palettes for intensity, diverging only for variance.
Estimated vs measured data visually distinct (hatched fill or icon badge).
Small multiples over dual-axis charts.

Chart selection by use case:
Scope or category breakdown: stacked bar or sunburst.
Hotspots by category or supplier: ranked horizontal bar or treemap.
Trend over time: line with optional YoY reference line.
Variance vs target: diverging bar.
Distribution: box plot or histogram, never a pie for >3 categories.
Geographic: choropleth only when regional insight is the point, otherwise bar.

## UX patterns

Progressive disclosure for calculations. Show headline kgCO2e first, let users drill into: spend amount -> activity quantity -> EF source -> assumptions -> final result. Each step is one click or expand.

Data provenance on every number. Hover or click reveals: EF source and version, matching method (spend-based vs activity-based), confidence score, assumptions, last updated, who overrode it (if anyone).

Sensible defaults, explicit overrides. Auto-match EFs with a confidence score. Let users override. Log the override with reason.

Dense data, calm layout. Prefer tables and small multiples. Reserve visual weight for the insight, not the chrome.

Analyst-grade interactions. Full keyboard nav. Bulk select and bulk actions on any list. Persistent filters across sessions. Copy-as-CSV everywhere. Saved views.

Error prevention over recovery. Validate file structure on upload before processing. Flag unit mismatches. Confirm before destructive recalcs. Dry-run mode for bulk overrides.

Upload states made explicit: empty, uploading, validating, matching, matched with issues, matched clean, results ready. Never leave the user guessing which state they are in.

## Accessibility

WCAG 2.1 AA minimum.
Text contrast ≥ 4.5:1, UI and large text contrast ≥ 3:1.
Focus states always visible, never suppressed.
State never encoded by color alone, always pair with icon, pattern, or text.
All interactive elements keyboard reachable, focus order matches visual order.
Semantic HTML, headings in order, landmarks present.
Tables use th with scope, captions where helpful.
Form inputs always labeled, errors linked via aria-describedby.
Motion respects prefers-reduced-motion.

## UX writing

Voice: clear, professional, plain. No marketing language, no emojis.
Tone: respect analyst expertise, explain to procurement users without condescension.
Case: sentence case for buttons, titles, labels, and menu items.
Buttons: verb first. "Match emission factors", "Export CSV", "Recalculate totals". Not "Submit", "OK", or "Continue".
Acronyms: define on first use per screen (EF, kgCO2e, GHG).
Numbers: thousands separators, 2-3 significant figures for displayed totals, full precision available on hover or in detail view.
Dates: ISO 8601 in data, "24 Apr 2026" format in UI.
Error messages: what happened, why, what to do next, in that order.
Empty states: what this is, why it is empty, one clear action to fix it.

## Component preferences

If a codebase is linked: prefer existing Forward Earth design system components, match exact prop names and variants. Do not invent styling that competes with the system.
If no codebase is linked: use clean neutral components consistent with the rules above. Avoid shadcn defaults without adapting to our token scale.

## What not to do

No decorative illustrations on analytical screens.
No pie charts with more than 3 slices.
No gradients on data encodings.
No color-only state indicators.
No placeholder lorem ipsum. Use realistic emissions data: suppliers, spend categories, kgCO2e values in plausible ranges.
No dark mode as default. Light-first, dark as parity later.
No "dashboard" that is just four donut charts. Lead with ranked tables and trend lines.

## Quality bar

Consulting-grade data presentation, analyst-grade interaction. The product's job is trust and speed-to-insight, not delight. Delight comes from accuracy and flow.
