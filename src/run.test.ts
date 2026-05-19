import { runExecutorAction, type LlmExeRuntime } from "./run";
import type { ActionInput } from "./input";

describe("runExecutorAction", () => {
  it("constructs llm-exe primitives and executes the executor", async () => {
    const addUserMessage = jest.fn();
    const execute = jest.fn().mockResolvedValue({ ok: true });
    const llm = { call: jest.fn() };
    const prompt = { addUserMessage };
    const parser = {};

    const runtime: LlmExeRuntime = {
      useLlm: jest.fn().mockReturnValue(llm),
      createChatPrompt: jest.fn().mockReturnValue(prompt),
      createParser: jest.fn().mockReturnValue(parser),
      createLlmExecutor: jest.fn().mockReturnValue({ execute }),
    } as any;

    const input: ActionInput = {
      provider: "openai.chat.v1",
      model: "gpt-4o-mini",
      system: "System",
      message: "Message {{input}}",
      data: { input: "value" },
      parser: "json",
      parserOptions: { schema: { type: "object" } },
      llmOptions: { temperature: 0 },
      executorOptions: { jsonSchema: { type: "object" } },
      debug: false,
    };

    const output = await runExecutorAction(input, runtime);

    expect(runtime.useLlm).toHaveBeenCalledWith("openai.chat.v1", {
      temperature: 0,
      model: "gpt-4o-mini",
    });
    expect(runtime.createChatPrompt).toHaveBeenCalledWith("System", {
      allowUnsafeUserTemplate: true,
    });
    expect(addUserMessage).toHaveBeenCalledWith("Message {{input}}");
    expect(runtime.createParser).toHaveBeenCalledWith("json", {
      schema: { type: "object" },
    });
    expect(runtime.createLlmExecutor).toHaveBeenCalledWith(
      { llm, prompt, parser },
      expect.objectContaining({
        hooks: expect.objectContaining({ onComplete: expect.any(Function) }),
      })
    );
    expect(execute).toHaveBeenCalledWith(
      { input: "value" },
      { jsonSchema: { type: "object" } }
    );
    expect(output).toEqual({
      result: '{"ok":true}',
      json: '{"ok":true}',
    });
  });
});
