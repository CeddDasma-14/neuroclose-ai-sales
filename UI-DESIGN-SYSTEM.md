# 🎨 UI Design System — Claude + Google Stitch Toolkit

> A dynamic, project-agnostic design assistant.
> Drop this into any Claude Project to get structured, beautiful, production-ready UI —
> from first idea → Google Stitch generation → refined code output.

---

## 👋 How This Works

This file turns Claude into your **personal UI design partner**. Here's the flow:

```
You describe what you want
        ↓
Claude helps you pick a style direction
        ↓
Claude gives you the perfect Google Stitch prompt
        ↓
You generate in Stitch, export HTML/CSS
        ↓
Claude refines it into production-ready code
```

Just tell Claude what you're building and it handles the rest.

---

## 🚀 Start Here — Tell Claude This

When starting a new project, say:

```
I want to build a [what you're building].
Audience: [who uses it]
Vibe: [any references, words, or feelings — or say "help me decide"]
Tech: [HTML/CSS · React · Vue · or "doesn't matter"]
```

**Examples:**
```
I want to build a fitness tracking dashboard.
Audience: gym enthusiasts
Vibe: dark, energetic, data-rich
Tech: React
```
```
I want to build a recipe app.
Audience: home cooks
Vibe: warm, cozy, editorial — help me decide the exact direction
Tech: HTML/CSS
```
```
I want to build a crypto portfolio tracker.
Audience: retail investors
Vibe: futuristic, clean, trustworthy
Tech: doesn't matter
```

Claude will take it from there.

---

## 🎭 Style Direction Menu

Claude will help you pick one. Each has a distinct personality.

### 01 · DARK LUXURY
> Premium apps, fintech, city intelligence, crypto, analytics
- Deep navy / charcoal backgrounds
- Gold or neon accent (one hero color)
- Glassmorphism cards with glow borders
- Syne or Clash Display headings
- Dense, data-rich layouts
- **Glow effects: YES** — box-shadow with color

### 02 · LIGHT EDITORIAL
> Blogs, portfolios, content platforms, news, lifestyle brands
- White or cream base
- Strong typographic hierarchy
- One bold accent (black, terracotta, forest green)
- Serif display + grotesque body
- Generous whitespace, asymmetric layouts
- **Glow effects: NO** — shadows are soft and neutral

### 03 · SOFT PASTEL / PLAYFUL
> Consumer apps, productivity tools, social, wellness, kids
- Muted pastel backgrounds (lavender, peach, mint)
- Rounded everything — pill buttons, bubbly cards
- Friendly sans-serif (Plus Jakarta Sans, Nunito)
- Colorful but harmonious palette
- Micro-animations, bouncy interactions
- **Glow effects: subtle** — soft diffuse only

### 04 · BRUTAL / RAW
> Portfolios, agencies, art projects, developer tools
- High contrast: pure black + pure white
- Bold grid-breaking layouts
- Oversized type, tight tracking
- Monospace or condensed display fonts
- Borders everywhere, no rounded corners
- **Glow effects: NO** — raw and flat

### 05 · RETRO / FUTURISTIC (Y2K · Cyberpunk · Synthwave)
> Gaming, music, NFT, entertainment, nightlife
- Dark base with electric neon accents (magenta, electric blue, lime)
- Scanline textures, grain overlays
- Pixel or techno display fonts
- Glitch animations, CRT effects
- Grid patterns, geometric shapes
- **Glow effects: YES** — heavy neon glow is the point

### 06 · MINIMAL / CORPORATE
> SaaS, B2B tools, dashboards, enterprise
- White or light gray base
- Subtle blues and greens
- Clean sans-serif throughout (but NOT Inter — try Geist, Figtree, Outfit)
- Data tables, clear hierarchy
- Functional over decorative
- **Glow effects: NO** — flat and clean

### 07 · ORGANIC / NATURAL
> Health, food, travel, sustainability, wellness brands
- Earth tones: warm beige, terracotta, forest, sage
- Soft textures, noise grain overlays
- Serif or humanist sans (Fraunces, Lora, Instrument Sans)
- Flowing shapes, no sharp corners
- Photography-forward layouts
- **Glow effects: NO** — warm shadows only

### 08 · GLASSMORPHISM / FROSTED
> Mobile apps, dashboards, music players, weather apps
- Semi-transparent frosted cards (`backdrop-filter: blur`)
- Colorful gradient background behind glass layers
- Light or dark base both work
- Clean rounded components
- SF Pro or Geist for legibility
- **Glow effects: SUBTLE** — soft ambient only

---

## 🎨 Token Templates

Once a style is chosen, Claude will fill these in for your specific project.

### Color Tokens (Claude fills this per project)
```css
:root {
  /* — Backgrounds — */
  --color-base:      [TBD];   /* Page background */
  --color-surface:   [TBD];   /* Card / panel */
  --color-surface-2: [TBD];   /* Nested surface */
  --color-border:    [TBD];   /* Default border */

  /* — Brand / Accent — */
  --color-accent:       [TBD];   /* Primary CTA / hero */
  --color-accent-dim:   [TBD];   /* Accent at ~15% opacity */
  --color-accent-glow:  [TBD];   /* Accent at ~30% opacity for shadow */

  /* — Text — */
  --color-text:         [TBD];   /* Body text */
  --color-text-muted:   [TBD];   /* Secondary text */
  --color-text-dim:     [TBD];   /* Disabled / hints */

  /* — Semantic — */
  --color-success: [TBD];
  --color-warning: [TBD];
  --color-danger:  [TBD];
  --color-info:    [TBD];
}
```

### Typography Tokens (Claude fills this per project)
```css
:root {
  --font-display: '[TBD]', sans-serif;  /* Headings, labels */
  --font-body:    '[TBD]', sans-serif;  /* Body, data, UI */
  --font-mono:    '[TBD]', monospace;   /* Code, numbers */

  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-lg:   18px;
  --text-xl:   24px;
  --text-2xl:  32px;
  --text-3xl:  48px;
}
```

### Spacing & Radius (consistent across all styles)
```css
:root {
  --space-1:  4px;   --space-2:  8px;
  --space-3:  12px;  --space-4:  16px;
  --space-5:  20px;  --space-6:  24px;
  --space-8:  32px;  --space-10: 40px;
  --space-12: 48px;  --space-16: 64px;

  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-pill: 9999px;
}
```

---

## 📋 Google Stitch Prompt Builder

Claude will auto-generate this for you. Here's the template it uses:

```
[THEME] mobile/web UI design.

Background: [hex].
Card surface: [hex].
Primary accent color: [hex] — use for CTAs, highlights, active states.
Secondary colors: [hex list if any].

Typography:
- Headings: [font name]
- Body: [font name]

Visual style:
- [specific aesthetic notes — e.g. "glassmorphism cards with soft glow borders"]
- [layout notes — e.g. "dense data layout with clear hierarchy"]
- [texture notes — e.g. "subtle grain overlay on background"]

Component to generate: [exactly what you want]

Additional: [accessibility, responsive, dark/light mode notes]
```

### Example Stitch Prompts (Claude generates these for you)

**Dark Luxury Dashboard:**
```
Dark luxury analytics dashboard. Background #080b10.
Card surfaces #0e1219 with subtle border rgba(255,255,255,0.07).
Primary accent: gold #f0a500 — CTA buttons, active tabs, key numbers.
Typography: Syne Bold for headings, DM Sans for data.
Glassmorphism cards, gold glow borders on hover.
Generate: revenue overview with KPI cards, sparkline charts, data table.
Dark theme only. Dense layout.
```

**Soft Playful Productivity:**
```
Soft pastel productivity app. Background #faf8ff.
Card surfaces white with lavender border #e8e0ff.
Primary accent: violet #7c3aed — buttons, progress bars, icons.
Secondary: coral #f97316 for alerts, mint #10b981 for success.
Typography: Plus Jakarta Sans throughout, rounded and friendly.
Pill-shaped buttons, bouncy micro-animations.
Generate: task list with progress tracking, calendar strip, habit tracker.
Light theme. Airy layout with plenty of breathing room.
```

**Brutalist Portfolio:**
```
Brutalist portfolio website. Pure black #000 background.
Pure white #fff text. No gradients, no rounded corners.
Accent: electric yellow #faff00 — used sparingly for hover states only.
Typography: Space Grotesk Bold 900 for display, Courier New for body.
Hard borders, grid-based layout, oversized type.
Generate: hero section with name, role, and project grid.
Desktop-first. Provocative and raw.
```

---

## 🛠️ Claude Refinement Commands

After generating in Stitch and pasting the export, use these commands:

### Apply Your Style System
```
Apply my style system to this Stitch export.
Keep the layout structure, but:
- Replace all colors with my token variables
- Swap fonts to [display font] + [body font]
- Add hover states and transitions
- Make cards use the glassmorphism/flat/editorial pattern from my style
```

### Add Polish
```
Polish this component:
- Add entrance animation (fade up, staggered children)
- Add hover micro-interactions
- Fix spacing to use my spacing scale
- Ensure consistent border-radius
```

### Fix a Specific Thing
```
The [cards / buttons / typography / colors / spacing] feel off.
Fix only that part to match [style direction] aesthetic.
```

### Generate a Variant
```
Create 2 more variants of this component:
- Variant A: [compact / minimal / dense]
- Variant B: [expanded / detailed / decorative]
Keep the same token system.
```

### Full Critique
```
Critique this UI against [style direction] principles.
List: what's working, what's off, what's missing.
Then rewrite the CSS to fix the issues.
```

---

## ✅ Universal Design Rules

These apply **regardless of style direction:**

| Rule | Why |
|------|-----|
| Always use CSS variables for colors | Easy to retheme, no magic values |
| Max 3 font weights per project | Too many weights = visual noise |
| One hero accent color, max two supporting | Prevents rainbow chaos |
| Consistent border-radius per project | Pick one scale and stick to it |
| Every interactive element has a hover state | Feels alive, not static |
| Entrance animations on page load | Staggered fade-up, 300–500ms total |
| Never use default browser styles | Reset or normalize everything |
| Mobile-first breakpoints | `min-width` media queries |
| Group related elements with spacing | 4px between items, 16px between groups, 40px between sections |
| Test in dark AND light mode | Even if you only ship one |

---

## 🚫 Never Do These

| ❌ Never | ✅ Instead |
|----------|-----------|
| Inter or Roboto as display font | Pick something with character |
| Purple gradient on white background | Choose a real direction |
| `color: #333` hardcoded | Use `var(--color-text)` |
| `border-radius: 4px` on everything | Use the radius scale intentionally |
| Generic card shadows | Style-matched shadows (glow / soft / none) |
| No hover states | Every clickable thing reacts |
| Animate everything | One well-timed entrance, then calm |
| 6+ accent colors | Max 3 in the palette |
| Mixing aesthetics randomly | Commit to one direction fully |
| Copy-paste Stitch output as-is | Always refine with Claude |

---

## 📁 Project Setup Checklist

When starting a new project with this system:

- [ ] Describe project to Claude (what, who, vibe)
- [ ] Pick style direction (01–08 or describe your own)
- [ ] Claude fills in color + font tokens
- [ ] Use Claude-generated prompt in Google Stitch
- [ ] Export Stitch output (HTML/CSS or to Figma)
- [ ] Paste into Claude for refinement
- [ ] Apply animations and hover states
- [ ] Claude generates remaining components in same style
- [ ] Final review: spacing, accessibility, responsiveness

---

*This file is a living document — update it as your taste evolves.*
*Version 1.0 · March 2026*
