---
name: fes-javascript
description: >
  Modern JavaScript (ES6+) patterns from the FES Institute curriculum.
  Covers DOM manipulation, event handling, async operations, form validation, and modular code.
---

# FES JavaScript Skill

## ES6+ Syntax Reference

### Variables and Constants
```javascript
const API_URL = 'https://api.example.com';
let currentPage = 1;
// Never use var
```

### Arrow Functions
```javascript
const add = (a, b) => a + b;
const greet = (name) => `Hello, ${name}!`;
const fetchData = async (url) => {
  const response = await fetch(url);
  return response.json();
};
```

### Destructuring
```javascript
// Object destructuring
const { name, email, role = 'user' } = userData;

// Array destructuring
const [first, second, ...rest] = items;

// Function parameter destructuring
const createCard = ({ title, description, imageUrl }) => {
  // ...
};
```

### Template Literals
```javascript
const html = `
  <div class="card">
    <h2 class="card__title">${title}</h2>
    <p class="card__description">${description}</p>
  </div>
`;
```

### Spread and Rest
```javascript
const merged = { ...defaults, ...userSettings };
const combined = [...oldItems, ...newItems];
const logAll = (...args) => args.forEach(arg => console.log(arg));
```

### Optional Chaining and Nullish Coalescing
```javascript
const city = user?.address?.city ?? 'Unknown';
const displayName = user?.name ?? 'Anonymous';
```

## DOM Manipulation Patterns

### Selection
```javascript
const header = document.querySelector('.header');
const cards = document.querySelectorAll('.card');
const form = document.getElementById('contact-form');
```

### Creating Elements
```javascript
const createElement = (tag, className, textContent) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
};

const card = createElement('div', 'card');
const title = createElement('h2', 'card__title', 'My Title');
card.appendChild(title);
```

### Class Manipulation
```javascript
element.classList.add('active');
element.classList.remove('active');
element.classList.toggle('open');
element.classList.contains('visible');
```

### Data Attributes
```javascript
// HTML: <button data-action="delete" data-id="42">Delete</button>
const action = button.dataset.action; // "delete"
const id = button.dataset.id;         // "42"
```

## Event Handling Patterns

### Event Delegation
```javascript
// Instead of adding listeners to every button,
// add one listener to the parent
document.querySelector('.card-grid').addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;

  const cardId = card.dataset.id;
  handleCardClick(cardId);
});
```

### Form Submission
```javascript
const form = document.querySelector('#contact-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    showMessage('Message sent successfully!', 'success');
    form.reset();
  } catch (error) {
    showMessage('Failed to send message. Please try again.', 'error');
  }
});
```

### Scroll and Intersection
```javascript
// Intersection Observer for scroll animations
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.animate-on-scroll').forEach((el) => {
  observer.observe(el);
});
```

## Fetch API Patterns

### GET Request
```javascript
const fetchItems = async () => {
  try {
    const response = await fetch(`${API_URL}/items`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return [];
  }
};
```

### POST Request
```javascript
const createItem = async (data) => {
  const response = await fetch(`${API_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};
```

### Loading States
```javascript
const loadContent = async (container) => {
  container.innerHTML = '<div class="loader" aria-label="Loading">Loading...</div>';

  try {
    const items = await fetchItems();
    container.innerHTML = items.map(renderCard).join('');
  } catch {
    container.innerHTML = '<p class="error">Failed to load content.</p>';
  }
};
```

## Form Validation Patterns

```javascript
const validators = {
  required: (value) => value.trim() !== '' || 'This field is required',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Please enter a valid email',
  minLength: (min) => (value) => value.length >= min || `Must be at least ${min} characters`,
  maxLength: (max) => (value) => value.length <= max || `Must be at most ${max} characters`,
};

const validateField = (input, rules) => {
  const value = input.value;
  const errorEl = input.parentElement.querySelector('.form-group__error');

  for (const rule of rules) {
    const result = rule(value);
    if (result !== true) {
      input.classList.add('form-group__input--error');
      if (errorEl) errorEl.textContent = result;
      return false;
    }
  }

  input.classList.remove('form-group__input--error');
  if (errorEl) errorEl.textContent = '';
  return true;
};
```

## Module Pattern

```javascript
// utils.js — utility functions
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
};

// main.js — imports and initialization
import { debounce, formatDate } from './utils.js';

const init = () => {
  // Initialize application
};

document.addEventListener('DOMContentLoaded', init);
```

## localStorage Patterns

```javascript
const storage = {
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('localStorage write failed:', error);
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },
};
```
