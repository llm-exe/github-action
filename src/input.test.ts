import { readActionInput } from "./input";

function source(values: Record<string, string>) {
  return {
    getInput(name: string) {
      return values[name] || "";
    },
  };
}

describe("action input", () => {
  it("reads the thin llm-exe executor inputs", () => {
    const input = readActionInput(
      source({
        provider: "openai.chat.v1",
        model: "gpt-4o-mini",
        system: "You are concise.",
        message: "Summarize {{input}}",
        data: '{"input":"hello"}',
        parser: "json",
        "parser-options": '{"schema":{"type":"object"}}',
        "llm-options": '{"temperature":0}',
        "executor-options": '{"traceId":"abc"}',
        debug: "true",
      })
    );

    expect(input).toEqual({
      provider: "openai.chat.v1",
      model: "gpt-4o-mini",
      system: "You are concise.",
      message: "Summarize {{input}}",
      data: { input: "hello" },
      parser: "json",
      parserOptions: { schema: { type: "object" } },
      llmOptions: { temperature: 0 },
      executorOptions: { traceId: "abc" },
      debug: true,
    });
  });

  it("defaults optional JSON inputs and parser", () => {
    const input = readActionInput(
      source({
        provider: "openai.gpt-4o-mini",
        message: "Hello",
      })
    );

    expect(input.parser).toBe("string");
    expect(input.data).toEqual({});
    expect(input.parserOptions).toEqual({});
    expect(input.llmOptions).toEqual({});
    expect(input.executorOptions).toEqual({});
  });

  it("rejects non-object JSON inputs", () => {
    expect(() =>
      readActionInput(
        source({
          provider: "openai.gpt-4o-mini",
          message: "Hello",
          data: "[]",
        })
      )
    ).toThrow('Input "data" must be a JSON object.');
  });
});
