---
name: fes-html-css
description: >
  HTML5 and CSS3 code generation patterns from the FES Institute curriculum.
  Covers semantic markup, modern CSS layouts, BEM naming, and mobile-first responsive design.
---

# FES HTML & CSS Skill

## Semantic HTML5 Elements

Use the right element for the right purpose:

| Element | Use For |
|---|---|
| `<header>` | Site/section header with logo, nav |
| `<nav>` | Primary navigation links |
| `<main>` | Primary page content (one per page) |
| `<article>` | Self-contained content (blog post, card) |
| `<section>` | Thematic grouping with a heading |
| `<aside>` | Sidebar, related content |
| `<footer>` | Site/section footer |
| `<figure>` | Image with caption |
| `<time>` | Dates and times |
| `<address>` | Contact information |

## HTML5 Page Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Page description here">
  <title>Page Title</title>
  <link rel="stylesheet" href="styles/tokens.css">
  <link rel="stylesheet" href="styles/main.css">
</head>
<body>
  <header class="header">
    <nav class="nav" aria-label="Main navigation">
      <a href="/" class="nav__logo">Logo</a>
      <ul class="nav__list" role="list">
        <li class="nav__item"><a href="#" class="nav__link">Home</a></li>
      </ul>
    </nav>
  </header>

  <main id="main-content">
    <section class="hero">
      <h1 class="hero__title">Heading</h1>
      <p class="hero__subtitle">Subheading text</p>
    </section>
  </main>

  <footer class="footer">
    <p>&copy; 2026 Company Name</p>
  </footer>

  <script src="js/main.js" defer></script>
</body>
</html>
```

## CSS Flexbox Patterns

```css
/* Horizontal navigation */
.nav__list {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Centered content section */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
  padding: var(--spacing-xl);
}

/* Space-between header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
}
```

## CSS Grid Patterns

```css
/* Responsive card grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

/* Two-column layout with sidebar */
.layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--spacing-lg);
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

/* Full page grid layout */
.page {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}
```

## BEM Naming Convention

```css
/* Block */
.card { }

/* Element (child of block) */
.card__image { }
.card__title { }
.card__description { }
.card__actions { }

/* Modifier (variation) */
.card--featured { }
.card--compact { }
.card__title--large { }
```

## Mobile-First Responsive Breakpoints

```css
/* Base styles = mobile (smallest screens) */
.container {
  padding: var(--spacing-sm);
}

/* Tablet (480px+) */
@media (min-width: 480px) {
  .container {
    padding: var(--spacing-md);
  }
}

/* Laptop (768px+) */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-lg);
    max-width: 720px;
    margin: 0 auto;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
}

/* Large desktop (1200px+) */
@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
}
```

## CSS Reset (Minimal)

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 100%;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height-body);
  color: var(--color-text);
  background-color: var(--color-bg);
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

ul[role="list"] {
  list-style: none;
  padding: 0;
}
```

## Common Component Patterns

### Button

```html
<button class="btn btn--primary" type="button">Click Me</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  font-weight: 600;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.btn--primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.btn--primary:hover {
  background-color: var(--color-primary-dark);
}

.btn--outline {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}
```

### Form Input

```html
<div class="form-group">
  <label for="email" class="form-group__label">Email</label>
  <input type="email" id="email" class="form-group__input" required
         placeholder="you@example.com" aria-describedby="email-hint">
  <span id="email-hint" class="form-group__hint">We'll never share your email.</span>
</div>
```
