export type ParserName =
  | "json"
  | "string"
  | "boolean"
  | "number"
  | "stringExtract"
  | "listToArray"
  | "listToJson"
  | "listToKeyValue"
  | "replaceStringTemplate"
  | "markdownCodeBlocks"
  | "markdownCodeBlock";

export interface ActionInput {
  provider: string;
  model?: string;
  system?: string;
  message: string;
  data: Record<string, unknown>;
  parser: ParserName;
  parserOptions: Record<string, unknown>;
  llmOptions: Record<string, unknown>;
  executorOptions: Record<string, unknown>;
  debug: boolean;
}

const PARSERS = new Set<ParserName>([
  "json",
  "string",
  "boolean",
  "number",
  "stringExtract",
  "listToArray",
  "listToJson",
  "listToKeyValue",
  "replaceStringTemplate",
  "markdownCodeBlocks",
  "markdownCodeBlock",
]);

export interface ActionInputSource {
  getInput(name: string): string;
}

export function readActionInput(source: ActionInputSource): ActionInput {
  const provider = required(source, "provider");
  const message = required(source, "message");
  const parser = readParser(source.getInput("parser") || "string");
  const model = optional(source.getInput("model"));
  const system = optional(source.getInput("system"));

  return {
    provider,
    model,
    system,
    message,
    parser,
    data: readJsonObject(source.getInput("data"), "data"),
    parserOptions: readJsonObject(
      source.getInput("parser-options"),
      "parser-options"
    ),
    llmOptions: readJsonObject(source.getInput("llm-options"), "llm-options"),
    executorOptions: readJsonObject(
      source.getInput("executor-options"),
      "executor-options"
    ),
    debug: readBoolean(source.getInput("debug")),
  };
}

function required(source: ActionInputSource, name: string) {
  const value = source.getInput(name).trim();
  if (!value) {
    throw new Error(`Missing required input: ${name}`);
  }
  return value;
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readParser(value: string): ParserName {
  const parser = value.trim() as ParserName;
  if (!PARSERS.has(parser)) {
    throw new Error(
      `Invalid parser "${value}". Valid parsers are: ${Array.from(PARSERS).join(
        ", "
      )}`
    );
  }
  return parser;
}

function readJsonObject(value: string, name: string): Record<string, unknown> {
  const source = value.trim() || "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error(
      `Input "${name}" must be valid JSON. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`Input "${name}" must be a JSON object.`);
  }

  return parsed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBoolean(value: string): boolean {
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
