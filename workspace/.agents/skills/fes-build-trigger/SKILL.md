---
name: fes-build-trigger
description: >
  Teaches the main SupaClaw agent to detect web-building requests and route them to the FES Builder pipeline.
  Handles intent detection and project handoff.
---

# FES Build Trigger Skill

## When to Activate

Trigger the FES Builder when the user's message matches any of these patterns:

- "Build me a..." (website, app, page, dashboard, etc.)
- "Create a..." (landing page, portfolio, React app, etc.)
- "Make a..." (web page, SaaS app, blog, etc.)
- "I need a..." (website for..., frontend for..., etc.)
- "Design and build..." (any web project)
- "Generate a..." (web page, site, app)
- Explicit mention of HTML, CSS, JavaScript, or React project creation

## How to Route

When you detect a web-building intent:

1. **Acknowledge** the request and confirm what you'll build
2. **Clarify** if needed: static site vs React app, specific pages, branding preferences
3. **Call the FES Builder** by using `web_fetch` to POST to your own `/functions/v1/fes-builder` endpoint with the project description
4. **Or use spawn_agent** to invoke the orchestrator directly:
   ```
   spawn_agent({
     prompt: "<user's project description>",
     overlay_path: ".agents/fes-orchestrator",
     agent_name: "FES Orchestrator",
     max_steps: 15
   })
   ```
5. **Report results** to the user with the file paths and instructions

## Project Type Detection

| Keywords | Project Type |
|---|---|
| portfolio, personal site | Static site |
| landing page, single page | Landing page (static) |
| React, SPA, single page app | React app |
| dashboard, admin panel | SaaS app (React) |
| e-commerce, store, shop | React app |
| blog | Static or React depending on complexity |

## Example Interaction

**User:** "Build me a portfolio website with a hero section, my projects, and a contact form"

**Agent response:**
"I'll build you a portfolio website with three sections: hero, projects grid, and contact form. Let me fire up the FES Builder swarm."

Then invoke the FES Builder pipeline.
