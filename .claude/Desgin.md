# Design System — HelloXXX

## Design Philosophy

**Cute, colorful, personal — NOT corporate.**
Inspired by early 2000s Friendster/Blogspot personal pages. Every user should feel like they have their own little cozy space online. Think handwritten fonts, pastel colors, rounded corners, playful stickers. Avoid: sharp edges, grey-heavy UIs, business dashboard vibes.

---

## Color Palette

### Core Brand Colors
```css
/* Primary — bubbly pink (main CTA, accents) */
--color-primary: #FF6B9D       /* hot pink */
--color-primary-light: #FFB3CC
--color-primary-dark: #E5447A

/* Secondary — soft purple (friend requests, proposals) */
--color-secondary: #B48EFF
--color-secondary-light: #D9C7FF
--color-secondary-dark: #8B5CF6

/* Accent — sunshine yellow (highlights, badges) */
--color-accent: #FFD93D
--color-accent-light: #FFF0A0

/* Success — mint green (accepted events) */
--color-success: #6BCBA5
--color-success-light: #B8EDD8

/* Surface — warm white (not cold white) */
--color-surface: #FFFAF7
--color-surface-2: #FFF0F5    /* pink-tinted panels */

/* Text */
--color-text-primary: #2D2D2D
--color-text-muted: #9B8EA3   /* purple-grey */
```

### Calendar Day State Colors
| State | Background | Border | Label |
|-------|-----------|--------|-------|
| Available | `#FFFFFF` | `#E8D5EE` | white |
| Blocked | `#E5E5E5` | `#CCCCCC` | blocked |
| Planned/Accepted | `#FFB3CC` | `#FF6B9D` | pink |
| Pending | `#D9C7FF` | `#B48EFF` | purple |
| Today | `#FFD93D` ring | yellow ring | today |

---

## Typography

### Font Stack
```css
/* Display / Profile headers — handwritten feel */
font-family: 'Nunito', 'Fredoka One', sans-serif;

/* Body / UI — friendly rounded sans */
font-family: 'Nunito', 'DM Sans', sans-serif;

/* Calendar numbers — clean but not robotic */
font-family: 'Nunito', sans-serif;
```

Load via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Fredoka+One&display=swap" rel="stylesheet">
```

### Type Scale
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display` | 2rem / 32px | 800 | Profile "Welcome to my..." banner |
| `heading` | 1.5rem / 24px | 700 | Section headers |
| `subheading` | 1.125rem / 18px | 600 | Card titles, month label |
| `body` | 1rem / 16px | 400 | Default text |
| `small` | 0.875rem / 14px | 400 | Meta, timestamps |
| `tiny` | 0.75rem / 12px | 500 | Badges, status labels |

---

## Spacing & Sizing

Follow Tailwind defaults. Key tokens:
```
4px  → xs gap, icon padding
8px  → inner card padding
12px → compact element spacing
16px → default padding
24px → section gap
32px → large section gap
48px → page section spacing
```

Border radius:
```
rounded-lg  (8px)  → buttons, inputs
rounded-xl  (12px) → cards, calendar cells
rounded-2xl (16px) → modals, panels
rounded-full       → avatars, badges, pill buttons
```

---

## Component Patterns

### Button
```
Primary   → bg-[#FF6B9D] text-white rounded-full px-5 py-2 font-semibold hover:bg-[#E5447A]
Secondary → bg-[#B48EFF] text-white rounded-full px-5 py-2 font-semibold
Ghost     → border-2 border-[#FF6B9D] text-[#FF6B9D] rounded-full px-5 py-2
Danger    → bg-red-400 text-white rounded-full px-5 py-2
```
All buttons: `transition-all duration-150 active:scale-95` for bouncy feel.

### Avatar
- Always `rounded-full`
- Sizes: 32px (tiny), 40px (nav), 56px (list), 96px (profile)
- Default fallback: colored circle with initials

### Card
```
bg-white rounded-2xl shadow-sm border border-[#F0E0F5] p-4
```
Hover state on clickable cards: `hover:shadow-md hover:-translate-y-0.5 transition-all`

### Calendar Cell
```
aspect-square rounded-xl border-2 p-1 cursor-pointer
transition-colors duration-100
```
State classes applied on top (see color table above).

### Modal / Popup (Meetup Propose Form)
```
fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50
Inner: bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl
```
Animation: `animate-in zoom-in-95 duration-200`

### Badge / Status Pill
```
rounded-full text-xs font-semibold px-3 py-0.5
pending  → bg-[#D9C7FF] text-[#6B3FA0]
accepted → bg-[#B8EDD8] text-[#1A7A52]
blocked  → bg-gray-200 text-gray-500
```

### Input
```
border-2 border-[#E8D5EE] rounded-xl px-4 py-2.5 w-full
focus:border-[#FF6B9D] focus:outline-none focus:ring-2 focus:ring-[#FFB3CC]/40
placeholder:text-[#C9B8D4] font-medium
```

---

## Profile Banner

- Full-width, fixed height: `h-40` (160px) on mobile, `h-56` (224px) on desktop
- Default gradient if no image: `from-[#FFB3CC] via-[#D9C7FF] to-[#FFD93D]`
- Display name overlaid at bottom-left with semi-transparent backdrop
- Edit button (pencil icon) top-right on own profile

---

## Navigation

- Top sticky nav, `bg-white/80 backdrop-blur-md border-b border-[#F0E0F5]`
- Logo left, nav links center/right
- Friend request badge: yellow circle with count
- Mobile: bottom tab bar (5 icons)

---

## Icon Usage (Lucide React)

Functional icons only — neutral strokes. Let color & theme carry personality.

Key icons:
```
Calendar     → CalendarDays
Friends      → Users, UserPlus
Meetup       → Coffee, Sparkles
Pending      → Clock
Accepted     → CheckCircle2
Declined     → XCircle
Settings     → Settings2
Banner edit  → ImagePlus
Memory/Photo → Camera, Image
Notification → Bell
```

Supplement with emoji for cute moments: ✨ 🌈 ☕ 🎉 🌸

---

## Themes (V2)

Theme stored in `users.theme` as JSON or preset key. Affects:
- Calendar cell colors
- Banner gradient defaults
- Accent color of nav
- Font choice (Nunito vs Fredoka)

Preset theme names (V2 ideas):
- `pastel-pink` (default)
- `lavender-dream`
- `sunshine`
- `mint-forest`
- `ocean-sky`
- `dark-kawaii` (dark mode cute variant)

Each theme = a set of CSS custom property overrides applied to `:root` or a wrapper div.

---

## Animation Principles

- Subtle spring/bounce on buttons (`active:scale-95`)
- Calendar cell hover: gentle scale + shadow
- Modal: zoom-in from center
- Page transitions: fade (avoid jarring slides)
- Stickers (V3): drop-in with slight rotation ±3deg
- Keep animations under 200ms — snappy not sluggish

---

## Responsive Breakpoints

| Breakpoint | Width | Notes |
|-----------|-------|-------|
| Mobile | < 640px | Bottom nav, compact calendar |
| Tablet | 640–1024px | Side nav optional |
| Desktop | > 1024px | Full sidebar nav, wider calendar |

Calendar always full-width within its container.
