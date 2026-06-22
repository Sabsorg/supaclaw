---
name: fes-react
description: >
  React development patterns from the FES Institute curriculum.
  Covers functional components, hooks, state management, routing, and component architecture.
---

# FES React Skill

## Functional Component Patterns

### Basic Component
```jsx
const Button = ({ children, variant = 'primary', onClick, disabled = false }) => {
  return (
    <button
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
```

### Component with State
```jsx
import { useState } from 'react';

const Counter = ({ initialCount = 0 }) => {
  const [count, setCount] = useState(initialCount);

  return (
    <div className="counter">
      <span className="counter__value">{count}</span>
      <button onClick={() => setCount((prev) => prev + 1)}>+</button>
      <button onClick={() => setCount((prev) => prev - 1)}>-</button>
    </div>
  );
};
```

### Component with Side Effects
```jsx
import { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled) setUser(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUser();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return <div className="loader">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!user) return null;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};
```

## Hooks Reference

### useState
```jsx
const [value, setValue] = useState(initialValue);
setValue(newValue);
setValue((prev) => prev + 1);
```

### useEffect
```jsx
// Run on mount and when deps change
useEffect(() => {
  // side effect
  return () => { /* cleanup */ };
}, [dep1, dep2]);

// Run once on mount
useEffect(() => { /* ... */ }, []);
```

### useRef
```jsx
const inputRef = useRef(null);

// Focus the input
inputRef.current?.focus();

// In JSX
<input ref={inputRef} />
```

### useContext
```jsx
import { createContext, useContext } from 'react';

const ThemeContext = createContext('light');

const ThemedComponent = () => {
  const theme = useContext(ThemeContext);
  return <div className={`theme--${theme}`}>Themed content</div>;
};

// Provider usage
<ThemeContext.Provider value="dark">
  <ThemedComponent />
</ThemeContext.Provider>
```

### useMemo and useCallback
```jsx
const expensiveValue = useMemo(() => computeExpensive(a, b), [a, b]);

const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

## Custom Hooks

### useFetch
```jsx
import { useState, useEffect } from 'react';

const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setData(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
};
```

### useLocalStorage
```jsx
import { useState } from 'react';

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    try {
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn('localStorage write failed:', error);
    }
  };

  return [storedValue, setValue];
};
```

### useForm
```jsx
import { useState } from 'react';

const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return { values, errors, submitting, handleChange, handleSubmit, reset };
};
```

## Component Composition Patterns

### Children Pattern
```jsx
const Card = ({ children, className = '' }) => (
  <div className={`card ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => (
  <div className="card__header">{children}</div>
);

const CardBody = ({ children }) => (
  <div className="card__body">{children}</div>
);

// Usage
<Card>
  <CardHeader><h3>Title</h3></CardHeader>
  <CardBody><p>Content here</p></CardBody>
</Card>
```

### Render Props
```jsx
const DataFetcher = ({ url, children }) => {
  const { data, loading, error } = useFetch(url);
  return children({ data, loading, error });
};

// Usage
<DataFetcher url="/api/users">
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error} />;
    return <UserList users={data} />;
  }}
</DataFetcher>
```

## List Rendering
```jsx
const ItemList = ({ items }) => (
  <ul className="item-list" role="list">
    {items.map((item) => (
      <li key={item.id} className="item-list__item">
        <span>{item.name}</span>
        <span>{item.description}</span>
      </li>
    ))}
  </ul>
);
```

## Conditional Rendering
```jsx
const StatusBadge = ({ status }) => {
  if (!status) return null;

  const variants = {
    active: 'badge--success',
    pending: 'badge--warning',
    inactive: 'badge--error',
  };

  return (
    <span className={`badge ${variants[status] ?? ''}`}>
      {status}
    </span>
  );
};
```

## React Router Setup
```jsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

const App = () => (
  <BrowserRouter>
    <nav className="nav">
      <NavLink to="/" className={({ isActive }) => isActive ? 'nav__link--active' : ''}>
        Home
      </NavLink>
      <NavLink to="/about">About</NavLink>
      <NavLink to="/contact">Contact</NavLink>
    </nav>

    <main>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  </BrowserRouter>
);
```

## App Entry Point Template
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
