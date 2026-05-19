export interface ActionOutput {
  result: string;
  json: string;
}

export function formatActionOutput(value: unknown): ActionOutput {
  return {
    result: formatResult(value),
    json: JSON.stringify(value),
  };
}

function formatResult(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "undefined") {
    return "";
  }

  return JSON.stringify(value);
}
