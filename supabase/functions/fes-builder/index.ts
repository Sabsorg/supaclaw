import { runAgent } from "../_shared/agent.ts";
import {
  jsonResponse,
  mustGetEnv,
  textResponse,
  timingSafeEqual,
} from "../_shared/helpers.ts";
import { logger } from "../_shared/logger.ts";
import { getConfigNumber, getConfigString } from "../_shared/helpers.ts";

const BUILDER_CHANNEL = "api" as const;
const FALLBACK_TEXT = "(no output)";

function isAuthorized(req: Request): boolean {
  const expected = mustGetEnv("WORKER_SECRET");
  const actual = req.headers.get("x-worker-secret") ?? "";
  return timingSafeEqual(expected, actual);
}

async function runBuilderStage(params: {
  stageName: string;
  prompt: string;
  runId: string;
  overlayPath?: string;
  agentName?: string;
  maxSteps?: number;
}): Promise<string> {
  const { stageName, prompt, runId, overlayPath, agentName, maxSteps } = params;
  const channelChatId = `fes-builder-${runId}-${stageName}`;
  const startedAt = Date.now();
  const defaultMaxSteps = getConfigNumber("fes.max_steps") ?? 50;

  logger.info("fes_builder.stage.start", { stageName, runId });

  try {
    const result = await runAgent({
      channel: BUILDER_CHANNEL,
      channelChatId,
      userMessage: {
        content: prompt,
        role: "system",
        channelUpdateId: `fes:${runId}:${stageName}`,
      },
      includeSessionHistory: false,
      overlayPath,
      agentName,
      maxSteps: maxSteps ?? defaultMaxSteps,
    });

    const text = ((await result.text) ?? "").trim() || FALLBACK_TEXT;
    logger.info("fes_builder.stage.done", {
      stageName,
      runId,
      textLength: text.length,
      ms: Date.now() - startedAt,
    });
    return text;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error("fes_builder.stage.failed", { stageName, runId, error: msg });
    return `[${stageName} failed: ${msg}]`;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return textResponse("method not allowed", { status: 405 });
  }
  if (!isAuthorized(req)) {
    return textResponse("forbidden", { status: 403 });
  }

  let body: { description?: string; project_type?: string } = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  const description = body.description?.trim();
  if (!description) {
    return jsonResponse(
      { error: "Missing 'description' field in request body" },
      { status: 400 },
    );
  }

  const projectType = body.project_type ?? "auto";
  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  logger.info("fes_builder.run.start", { runId, projectType });

  try {
    // Stage 1: Project Planner — decompose the request into a build plan
    const planOutput = await runBuilderStage({
      stageName: "planner",
      runId,
      overlayPath: ".agents/fes-orchestrator",
      agentName: "FES Orchestrator",
      prompt: [
        "You are the FES Orchestrator — the project planner for a frontend builder swarm.",
        "",
        "User request:",
        description,
        "",
        `Requested project type: ${projectType}`,
        "",
        "Your job: create a detailed project build plan.",
        "",
        "Steps:",
        "1. Load the fes-project-scaffold skill to get file structure templates",
        "2. Determine the project type (static, React, SaaS, landing page)",
        "3. Define the complete file list with paths (under projects/<project-name>/)",
        "4. Define shared conventions: CSS class naming (BEM), design token variable names",
        "5. List which specialist handles which files:",
        "   - FES Design: design tokens CSS file",
        "   - FES Markup: HTML files and CSS layout files",
        "   - FES Logic: JavaScript files",
        "   - FES React: React component files (if React project)",
        "   - FES Reviewer: all files (audit stage)",
        "",
        "Output a structured plan the other agents can follow. Be specific about file paths.",
      ].join("\n"),
    });

    // Stage 2: Design Foundation — create design tokens and visual system
    const designOutput = await runBuilderStage({
      stageName: "designer",
      runId,
      overlayPath: ".agents/fes-design",
      agentName: "FES Design Specialist",
      prompt: [
        "You are the FES Design Specialist.",
        "",
        "Project plan from the Orchestrator:",
        planOutput,
        "",
        "Original user request:",
        description,
        "",
        "Your job: create the design foundation for this project.",
        "",
        "Steps:",
        "1. Create a CSS custom properties file (design tokens) using write_file",
        "   - Color palette (primary, secondary, neutrals, semantic colors)",
        "   - Typography scale (font families, sizes, line heights)",
        "   - Spacing system (based on 8px unit)",
        "   - Border radii, shadows, transitions",
        "2. Create a CSS reset file using write_file",
        "3. Choose colors and typography that match the project's purpose",
        "4. Ensure all color combinations meet WCAG AA contrast (4.5:1)",
        "",
        "Write the files to the paths specified in the project plan.",
        "Report what you created so the next agents can reference your design tokens.",
      ].join("\n"),
    });

    // Stage 3: Parallel Build — markup, logic, and optionally React run in parallel
    const buildPromises = [
      // Markup Agent
      runBuilderStage({
        stageName: "markup",
        runId,
        overlayPath: ".agents/fes-markup",
        agentName: "FES Markup Specialist",
        prompt: [
          "You are the FES Markup Specialist.",
          "",
          "Project plan:",
          planOutput,
          "",
          "Design tokens created:",
          designOutput,
          "",
          "Your job: create all HTML and CSS files for this project.",
          "",
          "Steps:",
          "1. Load the fes-html-css skill for code patterns and templates",
          "2. Create each HTML file using write_file with semantic HTML5 elements",
          "3. Create CSS layout files using write_file",
          "4. Reference the design tokens (CSS custom properties) — never hardcode colors or spacing",
          "5. Use BEM naming for all CSS classes",
          "6. Ensure mobile-first responsive design with proper media queries",
          "7. Include proper meta tags, lang attribute, and accessibility attributes",
          "",
          "Write files to the paths specified in the project plan.",
        ].join("\n"),
      }),
      // Logic Agent
      runBuilderStage({
        stageName: "logic",
        runId,
        overlayPath: ".agents/fes-logic",
        agentName: "FES Logic Specialist",
        prompt: [
          "You are the FES Logic Specialist.",
          "",
          "Project plan:",
          planOutput,
          "",
          "Design tokens created:",
          designOutput,
          "",
          "Your job: create all JavaScript files for this project.",
          "",
          "Steps:",
          "1. Load the fes-javascript skill for code patterns",
          "2. Create JavaScript files using write_file",
          "3. Use ES6+ syntax (const/let, arrow functions, destructuring, template literals)",
          "4. Implement event delegation for interactive elements",
          "5. Use async/await for any data fetching",
          "6. Add form validation if the project has forms",
          "7. Use ES modules for code organization",
          "8. Include smooth scroll, mobile nav toggle, and scroll animations as appropriate",
          "",
          "Write files to the paths specified in the project plan.",
        ].join("\n"),
      }),
    ];

    // Add React agent if the plan mentions React
    const planLower = planOutput.toLowerCase();
    if (
      planLower.includes("react") ||
      planLower.includes(".jsx") ||
      planLower.includes("component")
    ) {
      buildPromises.push(
        runBuilderStage({
          stageName: "react",
          runId,
          overlayPath: ".agents/fes-react",
          agentName: "FES React Specialist",
          prompt: [
            "You are the FES React Specialist.",
            "",
            "Project plan:",
            planOutput,
            "",
            "Design tokens created:",
            designOutput,
            "",
            "Your job: create all React component files for this project.",
            "",
            "Steps:",
            "1. Load the fes-react skill for component patterns",
            "2. Create React component files (.jsx) using write_file",
            "3. Use functional components with hooks (useState, useEffect, useRef, useContext)",
            "4. Create custom hooks for reusable logic (useFetch, useForm, etc.)",
            "5. Set up React Router if the app has multiple pages",
            "6. Create the App.jsx root component",
            "7. Create the index.jsx entry point",
            "8. Create package.json with dependencies",
            "",
            "Write files to the paths specified in the project plan.",
          ].join("\n"),
        }),
      );
    }

    const buildOutputs = await Promise.all(buildPromises);
    const [markupOutput, logicOutput, reactOutput] = buildOutputs;

    // Stage 4: Review — audit all generated files
    const reviewOutput = await runBuilderStage({
      stageName: "reviewer",
      runId,
      overlayPath: ".agents/fes-reviewer",
      agentName: "FES Reviewer",
      prompt: [
        "You are the FES Reviewer.",
        "",
        "Project plan:",
        planOutput,
        "",
        "Files created by the build agents:",
        "--- Markup Agent ---",
        markupOutput,
        "--- Logic Agent ---",
        logicOutput,
        ...(reactOutput ? ["--- React Agent ---", reactOutput] : []),
        "",
        "Your job: audit all generated files for quality, accessibility, and standards.",
        "",
        "Steps:",
        "1. Load the fes-responsive-a11y skill for accessibility standards",
        "2. Use list_files to find all files in the project directory",
        "3. Read each file using read_file",
        "4. Check HTML: semantic elements, heading hierarchy, alt text, labels, meta tags",
        "5. Check CSS: no unused rules, design tokens used, mobile-first, no !important",
        "6. Check JS: no console.log, proper error handling, event cleanup",
        "7. Check React (if present): functional components, proper hooks usage, keys on lists",
        "8. Check accessibility: keyboard navigation, focus styles, ARIA attributes, contrast",
        "9. Fix any issues found using edit_file",
        "10. Report: issues found, issues fixed, overall quality assessment",
      ].join("\n"),
    });

    // Stage 5: Delivery — summarize what was built
    const deliveryOutput = await runBuilderStage({
      stageName: "delivery",
      runId,
      overlayPath: ".agents/fes-orchestrator",
      agentName: "FES Orchestrator",
      maxSteps: 10,
      prompt: [
        "You are the FES Orchestrator. The project build is complete.",
        "",
        "Project plan:",
        planOutput,
        "",
        "Review results:",
        reviewOutput,
        "",
        "Your job: create a final delivery summary.",
        "",
        "Steps:",
        "1. Use list_files to get the complete list of generated files",
        "2. Summarize what was built: project type, pages/components, features",
        "3. List all generated file paths",
        "4. Include any notes from the reviewer",
        "5. Provide instructions for viewing/running the project",
        "",
        "Be concise. This summary will be shown to the user.",
      ].join("\n"),
    });

    const durationMs = Date.now() - startedAt;
    logger.info("fes_builder.run.done", { runId, durationMs });

    return jsonResponse({
      run_id: runId,
      duration_ms: durationMs,
      summary: deliveryOutput,
      stages: {
        plan: planOutput,
        design: designOutput,
        markup: markupOutput,
        logic: logicOutput,
        ...(reactOutput ? { react: reactOutput } : {}),
        review: reviewOutput,
        delivery: deliveryOutput,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error("fes_builder.run.error", { runId, error: msg });
    return jsonResponse({ error: msg, run_id: runId }, { status: 500 });
  }
});
