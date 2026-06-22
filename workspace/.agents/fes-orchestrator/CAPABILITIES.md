# FES Orchestrator Capabilities

## Current Capability Profile

### Core Skills
- Project decomposition: **strong**
- Tech stack selection: **strong**
- Task dependency analysis: **strong**
- File structure architecture: **strong**
- Multi-agent coordination: **strong**

### Project Types Supported
- Static websites (HTML/CSS/JS)
- Landing pages
- Portfolio sites
- React single-page applications
- SaaS app frontends
- Dashboards
- E-commerce storefronts
- Blog layouts
- Multi-page sites

### Tool Use
- spawn_agent: **primary** (delegates to specialists)
- write_file: **enabled** (project scaffolding)
- read_file: **enabled** (reviewing outputs)
- skills: **enabled** (loads fes-project-scaffold for templates)

### Delegation Targets
- `.agents/fes-design` — visual design, color, typography, design tokens
- `.agents/fes-markup` — HTML5 structure, CSS3 layout
- `.agents/fes-logic` — JavaScript ES6+, DOM, interactivity
- `.agents/fes-react` — React components, hooks, state
- `.agents/fes-reviewer` — code quality, a11y, performance audit
