---
name: Polished Rose
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#554247'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#887178'
  outline-variant: '#dbc0c7'
  surface-tint: '#a33565'
  primary: '#a33565'
  on-primary: '#ffffff'
  primary-container: '#ff7fb1'
  on-primary-container: '#781044'
  inverse-primary: '#ffb0cb'
  secondary: '#675a6b'
  on-secondary: '#ffffff'
  secondary-container: '#ecdaee'
  on-secondary-container: '#6c5e6f'
  tertiary: '#665c61'
  on-tertiary: '#ffffff'
  tertiary-container: '#b3a6ab'
  on-tertiary-container: '#443b40'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e3'
  primary-fixed-dim: '#ffb0cb'
  on-primary-fixed: '#3e001f'
  on-primary-fixed-variant: '#841c4d'
  secondary-fixed: '#efddf1'
  secondary-fixed-dim: '#d2c1d5'
  on-secondary-fixed: '#221826'
  on-secondary-fixed-variant: '#4f4353'
  tertiary-fixed: '#eddfe5'
  tertiary-fixed-dim: '#d1c3c9'
  on-tertiary-fixed: '#21191e'
  on-tertiary-fixed-variant: '#4e4449'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  margin-sm: 12px
  margin-md: 24px
  margin-lg: 48px
---

## Brand & Style
The design system evolves the playful "Friendiary" aesthetic into a sophisticated, lifestyle-oriented platform. It moves away from "bubbly" maximalism toward a **Modern Minimalist** style with a focus on editorial-grade typography and balanced white space. 

The target audience is socially active individuals who value organization and aesthetic harmony. The UI should evoke a sense of warmth, intentionality, and premium quality. By stripping away heavy borders and excessive gradients, we emphasize content and connections, replacing the "toy-like" feel with a "boutique-digital" experience.

## Colors
The palette is anchored by the original signature pink, now utilized with strategic restraint as a functional accent rather than a dominant background. 

- **Primary (#FF7FB1):** Used for key actions, active states, and brand-critical highlights.
- **Secondary (#4A3E4E):** A deep, warm charcoal used for high-contrast typography and iconography to provide professional grounding.
- **Surface (#FFF0F6):** A very pale blush used for large containers and subtle sectioning, maintaining the brand identity without overwhelming the eyes.
- **Neutral (#F8F9FA):** Provides clean, bright base layers to ensure the pink accents remain "clean" and sophisticated.

## Typography
We employ **Manrope** for its exceptional balance between geometric modernism and humanist warmth. It replaces the rounded, heavy-weighted fonts of the past with clean lines and precise kerning.

Headlines use a tighter letter spacing and heavier weights to create a strong visual hierarchy. Labels utilize uppercase styling with slight tracking to provide a professional, structured feel to small-scale metadata and navigation elements.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop (12 columns, 1200px max-width) and a fluid model for mobile. We utilize an 8px base grid to ensure consistent rhythm.

Spacing is generous to promote a "breathable" feel. While the original design crowded elements into tight boxes, this design system uses wide margins and clear gutters to distinguish between the calendar, sidebar, and navigation. Content should be grouped logically with clear white space "buffers" between unrelated sections.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and extremely soft **Ambient Shadows**. Instead of heavy borders, we use subtle shifts in background color (Neutral to Surface) to define areas.

For high-priority items like "New Meetup" prompts or active calendar days, a very diffused, low-opacity shadow (10% opacity of the secondary color) is used to lift the element. This creates a soft, tactile feel that is sophisticated rather than flat. Avoid the use of heavy outlines; use 1px "ghost borders" in a slightly darker shade of the surface color if structural definition is required.

## Shapes
We adopt a **Rounded (Level 2)** shape language. This maintains the "Friendly" aspect of the brand while removing the "child-like" ultra-roundness of the original UI. 

Standard components (buttons, input fields) use an 8px radius. Large containers like the calendar view or profile cards use a 16px radius. This consistent, moderate roundedness provides a modern, geometric appearance that feels professional yet approachable.

## Components
- **Buttons:** Primary buttons are solid Primary pink with white text. Secondary buttons use the Primary color for text/border with a transparent or white background. No gradients are used.
- **Calendar Grid:** Replace thick pink borders with thin (1px) neutral dividers. Active or "busy" days are indicated with a subtle Tonal Layer fill rather than a heavy outline.
- **Chips/Badges:** Use a light Tertiary background with Primary-colored text. Rounded-lg (16px) is preferred for a refined tag appearance.
- **Input Fields:** Minimalist design with a bottom-border only or a light neutral fill. Focused states use a 2px Primary border.
- **Cards:** Use white backgrounds with subtle ambient shadows. Content inside cards follows a strict vertical rhythm using the 8px spacing unit.
- **Navigation:** Top navigation should be clean and sparse, utilizing the Label-MD typography style for links to maintain a professional, organized header.