import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

export type LLMProvider = "openai" | "anthropic" | "google" | "bedrock" | "po-us";

export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-5.2",
  anthropic: "claude-4-5-opus-latest",
  google: "gemini-3-flash",
  bedrock: "us.anthropic.claude-sonnet-4-20250514-v1:0",
  "po-us": "claude-opus-4-7-20250514",
};

export function isLLMProvider(value: string): value is LLMProvider {
  return (
    value === "openai" ||
    value === "anthropic" ||
    value === "google" ||
    value === "bedrock" ||
    value === "po-us"
  );
}

export function resolveProviderModel(provider: LLMProvider, model?: string) {
  const resolvedModel = model || DEFAULT_MODELS[provider];
  switch (provider) {
    case "openai": {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
      return createOpenAI({ apiKey })(resolvedModel);
    }
    case "po-us": {
      // Po-us uses Anthropic Opus as its foundation model
      const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
      return createAnthropic({ apiKey })(resolvedModel);
    }
    case "anthropic": {
      const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
      return createAnthropic({ apiKey })(resolvedModel);
    }
    case "google": {
      const apiKey = Deno.env.get("GEMINI_API_KEY");
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
      return createGoogleGenerativeAI({ apiKey })(resolvedModel);
    }
    case "bedrock": {
      const region = Deno.env.get("AWS_REGION") ?? "us-east-1";
      const accessKeyId = Deno.env.get("AWS_BEDROCK_ACCESS_KEY");
      const secretAccessKey = Deno.env.get("AWS_BEDROCK_SECRET_ACCESS_KEY");
      if (!accessKeyId || !secretAccessKey) {
        throw new Error(
          "AWS_BEDROCK_ACCESS_KEY and AWS_BEDROCK_SECRET_ACCESS_KEY must be set",
        );
      }
      return createAmazonBedrock({ region, accessKeyId, secretAccessKey })(resolvedModel);
    }
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unsupported LLM provider: ${_exhaustive}`);
    }
  }
}
