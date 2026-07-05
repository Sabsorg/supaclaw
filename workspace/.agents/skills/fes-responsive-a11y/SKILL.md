---
name: fes-responsive-a11y
description: >
  Responsive design and accessibility patterns from the FES Institute curriculum.
  Covers media queries, mobile-first methodology, ARIA, WCAG compliance, and keyboard navigation.
---

# FES Responsive Design & Accessibility Skill

## Mobile-First Methodology

Always start with mobile styles as the default, then add complexity for larger screens:

```css
/* Mobile (default) */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Breakpoint System

| Name | Min Width | Typical Devices |
|---|---|---|
| xs | 0 | Small phones |
| sm | 480px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1200px | Desktops |
| xxl | 1440px | Large desktops |

## Responsive Typography

```css
:root {
  --font-size-base: 1rem;
}

@media (min-width: 768px) {
  :root {
    --font-size-base: 1.0625rem;
  }
}

@media (min-width: 1024px) {
  :root {
    --font-size-base: 1.125rem;
  }
}

/* Fluid typography using clamp */
h1 {
  font-size: clamp(1.75rem, 4vw + 0.5rem, 3rem);
}

h2 {
  font-size: clamp(1.375rem, 3vw + 0.375rem, 2.25rem);
}
```

## Responsive Images

```html
<!-- Responsive image with srcset -->
<img
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Description of the image"
  loading="lazy"
  width="800"
  height="600"
>

<!-- Art direction with picture -->
<picture>
  <source media="(min-width: 1024px)" srcset="hero-wide.jpg">
  <source media="(min-width: 768px)" srcset="hero-medium.jpg">
  <img src="hero-mobile.jpg" alt="Hero image" width="400" height="300">
</picture>
```

## Responsive Navigation Pattern

```html
<nav class="nav" aria-label="Main navigation">
  <a href="/" class="nav__logo">Logo</a>
  <button
    class="nav__toggle"
    aria-expanded="false"
    aria-controls="nav-menu"
    aria-label="Toggle navigation menu"
  >
    <span class="nav__hamburger"></span>
  </button>
  <ul id="nav-menu" class="nav__menu" role="list">
    <li><a href="/" class="nav__link">Home</a></li>
    <li><a href="/about" class="nav__link">About</a></li>
    <li><a href="/contact" class="nav__link">Contact</a></li>
  </ul>
</nav>
```

```css
.nav__toggle {
  display: flex;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-sm);
}

.nav__menu {
  display: none;
}

.nav__menu[data-open="true"] {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .nav__toggle {
    display: none;
  }

  .nav__menu {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-md);
  }
}
```

## WCAG AA Accessibility Checklist

### Perceivable
- [ ] All images have descriptive `alt` text (or `alt=""` for decorative)
- [ ] Color is not the only means of conveying information
- [ ] Text contrast ratio ≥ 4.5:1 (normal text) / ≥ 3:1 (large text, 18px+ bold or 24px+)
- [ ] UI component contrast ≥ 3:1 against background
- [ ] Content is readable and functional at 200% zoom
- [ ] Videos have captions (when applicable)

### Operable
- [ ] All interactive elements reachable via keyboard (Tab/Shift+Tab)
- [ ] Focus indicators visible on all interactive elements
- [ ] No keyboard traps (users can always Tab away)
- [ ] Skip navigation link present: `<a href="#main-content" class="skip-link">Skip to content</a>`
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] No time-based interactions without user control

### Understandable
- [ ] `<html lang="en">` attribute set
- [ ] Form inputs have visible `<label>` elements
- [ ] Error messages are clear and specific
- [ ] Navigation is consistent across pages
- [ ] Predictable behavior (no unexpected actions)

### Robust
- [ ] Valid HTML (no duplicate IDs, proper nesting)
- [ ] ARIA used correctly (not overused)
- [ ] Custom widgets follow WAI-ARIA patterns

## ARIA Patterns

### Skip Link
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<!-- ... header/nav ... -->
<main id="main-content" tabindex="-1">
```

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### Focus Styles
```css
/* Never remove focus indicators — restyle them */
:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

/* Remove default outline only when custom focus is applied */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Accessible Modal
```html
<div
  class="modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal description text.</p>
  <button aria-label="Close modal">×</button>
</div>
```

### Accessible Form Errors
```html
<div class="form-group">
  <label for="password">Password</label>
  <input
    type="password"
    id="password"
    aria-invalid="true"
    aria-describedby="password-error"
    required
  >
  <span id="password-error" class="form-group__error" role="alert">
    Password must be at least 8 characters.
  </span>
</div>
```

### Live Regions
```html
<!-- For dynamic status updates (e.g., form submission results) -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status">
  <!-- JS updates this content -->
</div>
```

### Screen Reader Only (Visually Hidden)
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```
