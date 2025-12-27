Got it — you want a **clean, authoritative, agent-readable style guide** that an **agentic AI can directly follow to generate websites** based on **your exact theme** (Prussian Blue × Orange × High-Contrast Modern), not a human-facing explanation.

Below is a **final, refined, deterministic style guide** written **as system instructions for an agentic AI**.
You can drop this directly into:

- an **AI system prompt**
- a **design agent**
- a **code-generation agent**
- a **multi-agent pipeline**

---

# AGENTIC WEBSITE STYLE GUIDE

**Theme Codename:** MODERN_CONTRAST_PRUSSIAN
**Design Category:** Professional · High-Contrast · Modern · Confident
**Primary Goal:** Generate visually consistent, accessible, premium websites

---

## 1. GLOBAL DESIGN DIRECTIVE (ABSOLUTE)

The website **must**:

- Look professional and confident
- Use strong contrast and whitespace
- Avoid decorative noise
- Prioritize clarity and hierarchy

❌ No playful UI
❌ No pastel palettes
❌ No soft “dribbble-style” gradients everywhere

---

## 2. COLOR SYSTEM (LOCKED TOKENS)

### Core Colors

```json
{
  "black": "#000000",
  "prussianBlue": "#14213D",
  "orange": "#FCA311",
  "alabasterGrey": "#E5E5E5",
  "white": "#FFFFFF"
}
```

### Semantic Mapping (MANDATORY)

| Semantic Role        | Color                  |
| -------------------- | ---------------------- |
| Primary background   | White                  |
| Secondary background | Alabaster Grey         |
| Structural elements  | Prussian Blue          |
| Primary action / CTA | Orange                 |
| Headings             | Black or Prussian Blue |
| Body text            | Black (80–90% opacity) |

### Color Usage Rules

- Orange **only** for emphasis or action
- Never use orange as a full-page background
- Never place black text on Prussian Blue
- White text **only** on Prussian Blue or Black

---

## 3. GRADIENT RULES (RESTRICTED)

### Allowed Gradients

```css
linear-gradient(45deg)
linear-gradient(135deg)
radial-gradient()
```

### Constraints

- Max **1 gradient per section**
- Gradient opacity overlays only (≤ 20%)
- Use gradients for:
  - Hero sections
  - Decorative overlays
  - Feature highlights

❌ No gradient body backgrounds
❌ No gradient text

---

## 4. TYPOGRAPHY SYSTEM

### Font Stack

```css
font-family:
  Inter,
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
```

### Type Scale

| Element       | Size    | Weight          |
| ------------- | ------- | --------------- |
| H1            | 48–64px | 800–900         |
| H2            | 32–40px | 700             |
| H3            | 20–24px | 600             |
| Body          | 16–18px | 400             |
| Meta / Labels | 12px    | 600 (uppercase) |

### Typography Rules

- Headlines must feel bold and authoritative
- No script, rounded, or decorative fonts
- Uppercase only for labels and metadata

---

## 5. LAYOUT & GRID SYSTEM

### Container Rules

- Max width: `1200px`
- Horizontal padding: `24px`
- Vertical section spacing: `80–120px`

### Section Pattern (DEFAULT)

```plaintext
Section
 ├─ Title (left aligned)
 ├─ Subtitle / Description
 ├─ Content (grid / cards)
```

❌ No center-aligned long paragraphs
❌ No dense layouts

---

## 6. COMPONENT DESIGN RULES

### Buttons

| Type      | Style                           |
| --------- | ------------------------------- |
| Primary   | Orange bg, black text           |
| Secondary | Prussian bg, white text         |
| Outline   | Prussian border, transparent bg |

```plaintext
Border-radius: 10–14px
Hover: opacity 90%
Active: scale 0.95
```

---

### Cards

- Background: White
- Border: Alabaster Grey (1–2px)
- Radius: 16–24px
- Shadow: subtle, increases on hover

❌ No glassmorphism
❌ No heavy shadows

---

### Navigation

- Background: Prussian Blue
- Text: White
- Hover / Active: Orange accent

---

## 7. INTERACTION & MOTION

### Allowed Animations

- Fade-in on scroll
- Hover lift (≤ 4px)
- Button press scale

### Forbidden Animations

- Bounce
- Elastic
- Infinite loops
- Attention-seeking motion

---

## 8. ICONOGRAPHY

- Style: Outline icons only
- Stroke: Medium
- Color: Prussian / Black
- Hover: Orange

❌ No emojis
❌ No filled icon sets

---

## 9. CONTENT & COPY RULES (AI WRITING STYLE)

### Tone

- Confident
- Clear
- Professional
- Minimal

### Writing Constraints

❌ No slang
❌ No hype words (“awesome”, “crazy”, “next-level”)
✅ Short, purposeful sentences

**Example**

> “Designed for clarity, performance, and control.”

---

## 10. ACCESSIBILITY (NON-OPTIONAL)

- WCAG AA minimum contrast
- CTA buttons must pass AAA contrast
- If contrast fails → auto-switch text color

---

## 11. DEFAULT PAGE STRUCTURE

### Homepage

```plaintext
Hero (gradient overlay)
→ Value Proposition
→ Feature Cards
→ Highlight CTA
→ Footer
```

### Required Pages

- Home
- Features / Services
- About
- Contact
- CTA / Conversion section

---

## 12. AI HARD CONSTRAINT SUMMARY

```plaintext
ALWAYS:
✔ High contrast
✔ Strong hierarchy
✔ Orange = action
✔ Clean whitespace

NEVER:
✖ Pastels
✖ Over-animation
✖ Decorative clutter
✖ Weak typography
```

---

## 13. INTENDED USE CASES

- AI SaaS products
- Dashboards
- Hackathon projects
- Enterprise & gov portals
- Professional portfolios

---

If you want next, I can:

- Convert this into a **system prompt**
- Generate **design tokens JSON**
- Create a **Tailwind config**
- Write a **“website generator agent prompt”**
- Map this to **Figma → Code rules**

Just tell me what you want next 🚀
