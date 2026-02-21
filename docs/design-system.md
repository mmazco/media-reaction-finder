# Design System

Single source of truth for all UI decisions in Media Reaction Finder. Reference this before creating or modifying any UI component.

---

## Typography

| Role | Font | Weight | Size | Usage |
|---|---|---|---|---|
| Page title | Georgia, serif | normal | 48px (32px mobile) | App name "Media Reaction Finder" |
| Section heading | Georgia, serif | normal | 22–24px | "Top discussions", "Reddit Discussions", "Web Articles", collection names |
| Result title | System default | 500 | 16px | Clickable article/post titles in result cards |
| Body / UI copy | Arial, sans-serif | 400 | 14–15px | Descriptions, summaries, labels, nav items, input text |
| Meta / caption | Arial, sans-serif | 400 | 11–13px | Timestamps, scores, comment counts, source labels |
| Button text | Arial, sans-serif | 600 | 12px | "ANALYZE REACTIONS", uppercase, 1.5px letter-spacing |

**Rule:** Georgia is for section titles and page headings only. Everything else is Arial.

---

## Colour Palette

### Base colours (light / dark)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg` | `rgb(240, 238, 231)` | `#000000` | Page background |
| `cardBg` | `#f5f5f5` | `#1a1a1a` | Result cards, sidebar items |
| `text` | `#000000` | `#ffffff` | Primary text |
| `textSecondary` | `#666666` | `#999999` | Subtitles, captions, meta |
| `border` | `#d0d0d0` | `#333333` | Card borders, dividers |
| `accent` | `#000000` | `#ffffff` | Buttons, menu icon background |
| `accentAlt` | `#333333` | `#cccccc` | Secondary emphasis |

### Category labels

| Label | Background | Text | Meaning |
|---|---|---|---|
| Mainstream Coverage | `#22c55e` (green) | `#fff` | Standard news reporting — factual, widely distributed |
| Analysis | `#7c3aed` (purple) | `#fff` | Think-pieces, explainers, research-backed |
| Opinion | `#2563eb` (blue) | `#fff` | Editorials, op-eds, personal viewpoint |

### Source badges

| Badge | Background | Text |
|---|---|---|
| Web | `#4ECDC4` (teal) | `#fff` |
| Reddit | `#FF6B6B` (red) | `#fff` |
| Substack | `#FF6719` (orange) | `#fff` |

### Utility

| Use | Light | Dark |
|---|---|---|
| AI summary box background | `#f0f0f0` | `#111` |
| AI summary left border | `#ccc` | `#444` |
| Comment thread left border | `#ddd` | `#333` |
| BETA badge | `#b8860b` bg / `#fff` text | `#ffd54f` bg / `#000` text |

---

## Components

### Menu toggle button
- 36×36px, `border-radius: 8px`
- Light: black background (`#1a1a1a`), white hamburger lines
- Dark: white background (`#fff`), dark lines (`#1a1a1a`)
- Position: fixed, top-left corner (`16px, 16px`)

### Result card (`styles.resultItem`)
- `padding: 15px`, `border-radius: 5px`
- Background: `cardBg` token
- Used everywhere: search results, homepage curated feed, topic discussions

### Source badge
- `font-size: 12px`, `padding: 2px 8px`, `border-radius: 4px`, `font-weight: 500`
- Colour per source type (see table above)

### Category label badge
- `font-size: 11px`, `padding: 2px 8px`, `border-radius: 4px`, `font-weight: 500`
- Colour per category (see table above)
- Fallback (unknown label): `cardBg` background, `textSecondary` text

### AI summary box (`styles.summary`)
- `font-size: 13px`, `line-height: 1.6`, `font-family: Arial, sans-serif`
- `padding: 8px 12px`, `border-radius: 4px`
- 3px left accent border
- Background/border colours from Utility table above

### Reddit comment thread
- `margin-top: 10px`, 2px left border (`comment thread left border` colour)
- `padding-left: 12px`
- Author: `font-size: 12px`, `font-weight: 600`
- Score: `font-size: 11px`, secondary colour
- Body: `font-size: 13px`, `line-height: 1.5`

### Button (primary)
- `padding: 14px 32px`
- Light: black bg, white text / Dark: white bg, black text
- `font-size: 12px`, `letter-spacing: 1.5px`, `font-weight: 600`, uppercase
- No border, no border-radius

### Input field
- Full width, `padding: 14px 18px`, `font-size: 15px`
- `border: 1px solid` (`#ccc` light / `#444` dark), `border-radius: 8px`
- Background: `#fff` light / `#111` dark
- `font-family: Arial, sans-serif`

### Sidebar
- Width: 300px desktop, 100% mobile
- Background: `bg` token
- `z-index: 1100` (above page content, below menu toggle)
- Slides in from left with `transform: translateX` transition

### Subreddit tab selector (homepage)
- Row of pill buttons, `font-size: 12px`, `padding: 4px 10px`
- Active tab: `accent` bg, inverse text
- Inactive tab: transparent bg, `border: 1px solid`, `textSecondary` colour

---

## Spacing

| Context | Value |
|---|---|
| Page padding | 20px all sides |
| Section gap | 40px (`styles.resultSection marginBottom`) |
| Card internal padding | 15–20px |
| Between cards | 20px |
| Title to content | 20px |

---

## Z-index layers

| Layer | Z-index |
|---|---|
| Collections page overlay | 1000 |
| Sidebar overlay (dim) | 1099 |
| Sidebar panel | 1100 |
| Mobile menu overlay | 1150 |
| Mobile slide-out menu | 1160 |
| Menu toggle button | 1200 |

---

## Dark mode behaviour

Every colour-dependent element must use the `darkMode` state to switch. The pattern is:

```
color: darkMode ? '<dark value>' : '<light value>'
```

Icons (GitHub, X) are `#1a1a1a` in light mode, `#fff` in dark mode.
Menu toggle inverts: black bg + white icon in light, white bg + dark icon in dark.
