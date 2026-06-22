---
name: fes-project-scaffold
description: >
  Project scaffolding templates for common frontend projects.
  Provides file structures, boilerplate, and conventions for static sites, React apps, SaaS apps, and landing pages.
---

# FES Project Scaffold Skill

## Static Site File Structure

```
projects/<project-name>/
├── index.html
├── about.html           (if multi-page)
├── contact.html         (if multi-page)
├── styles/
│   ├── tokens.css       (design tokens — CSS custom properties)
│   ├── reset.css        (CSS reset)
│   ├── main.css         (layout, typography, base styles)
│   └── components.css   (BEM component styles)
├── js/
│   ├── main.js          (initialization, imports)
│   └── utils.js         (utility functions)
├── assets/
│   ├── images/
│   └── fonts/
└── README.md
```

## React App File Structure

```
projects/<project-name>/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── index.jsx        (entry point)
│   ├── App.jsx          (root component + routing)
│   ├── components/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── AboutPage.jsx
│   │   └── ContactPage.jsx
│   ├── hooks/
│   │   ├── useFetch.js
│   │   └── useLocalStorage.js
│   ├── context/
│   │   └── ThemeContext.jsx
│   ├── utils/
│   │   └── helpers.js
│   └── styles/
│       ├── tokens.css
│       ├── reset.css
│       └── main.css
├── package.json
└── README.md
```

## SaaS App File Structure

```
projects/<project-name>/
├── src/
│   ├── index.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── ui/           (generic UI components)
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Card.jsx
│   │   ├── layout/       (layout components)
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── DashboardLayout.jsx
│   │   └── features/     (feature-specific components)
│   │       ├── auth/
│   │       │   ├── LoginForm.jsx
│   │       │   └── SignupForm.jsx
│   │       └── dashboard/
│   │           ├── StatsCard.jsx
│   │           └── DataTable.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── SettingsPage.jsx
│   ├── hooks/
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── utils/
│   │   ├── api.js
│   │   └── helpers.js
│   └── styles/
│       ├── tokens.css
│       └── main.css
├── package.json
└── README.md
```

## Landing Page File Structure

```
projects/<project-name>/
├── index.html
├── styles/
│   ├── tokens.css
│   ├── reset.css
│   └── main.css
├── js/
│   └── main.js
├── assets/
│   └── images/
└── README.md
```

## HTML5 Boilerplate

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="PROJECT_DESCRIPTION">
  <meta name="theme-color" content="#ffffff">

  <!-- Open Graph -->
  <meta property="og:title" content="PROJECT_TITLE">
  <meta property="og:description" content="PROJECT_DESCRIPTION">
  <meta property="og:type" content="website">

  <title>PROJECT_TITLE</title>

  <link rel="icon" href="favicon.ico">
  <link rel="stylesheet" href="styles/tokens.css">
  <link rel="stylesheet" href="styles/reset.css">
  <link rel="stylesheet" href="styles/main.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <header class="header">
    <nav class="nav" aria-label="Main navigation">
      <!-- Navigation content -->
    </nav>
  </header>

  <main id="main-content">
    <!-- Page content -->
  </main>

  <footer class="footer">
    <p>&copy; 2026 PROJECT_TITLE. All rights reserved.</p>
  </footer>

  <script src="js/main.js" defer></script>
</body>
</html>
```

## Design Token Template

```css
:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-primary-light: #60a5fa;
  --color-on-primary: #ffffff;

  --color-secondary: #7c3aed;
  --color-secondary-dark: #6d28d9;

  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #2563eb;

  --color-text: #1f2937;
  --color-text-light: #6b7280;
  --color-text-inverse: #ffffff;

  --color-bg: #ffffff;
  --color-bg-alt: #f9fafb;
  --color-bg-dark: #111827;

  --color-border: #e5e7eb;
  --color-border-dark: #d1d5db;

  /* Typography */
  --font-heading: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  --line-height-tight: 1.25;
  --line-height-body: 1.6;
  --line-height-loose: 1.75;

  /* Spacing (8px base) */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;

  /* Container */
  --container-max: 1200px;
  --container-padding: var(--spacing-md);
}
```

## Package.json Template (React)

```json
{
  "name": "PROJECT_NAME",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^6.0.0"
  }
}
```

## Project Naming Convention

All project files go under `projects/<project-name>/` where `<project-name>` is a kebab-case slug derived from the project description:
- "Portfolio website" → `projects/portfolio-website/`
- "SaaS Dashboard" → `projects/saas-dashboard/`
- "Coffee Shop Landing Page" → `projects/coffee-shop-landing/`
