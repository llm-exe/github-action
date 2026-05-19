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
      createLlmFunctionExecutor: jest.fn(),
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

  it("uses the function executor when callable functions are provided", async () => {
    const addUserMessage = jest.fn();
    const execute = jest.fn().mockResolvedValue([
      {
        type: "function_use",
        name: "create_release_note",
        input: { title: "Fix login" },
        functionId: "call_123",
      },
    ]);
    const llm = { call: jest.fn() };
    const prompt = { addUserMessage };
    const parser = {};

    const runtime: LlmExeRuntime = {
      useLlm: jest.fn().mockReturnValue(llm),
      createChatPrompt: jest.fn().mockReturnValue(prompt),
      createParser: jest.fn().mockReturnValue(parser),
      createLlmExecutor: jest.fn(),
      createLlmFunctionExecutor: jest.fn().mockReturnValue({ execute }),
    } as any;

    const input: ActionInput = {
      provider: "openai.chat.v1",
      model: "gpt-4o-mini",
      system: "System",
      message: "Message {{input}}",
      data: { input: "value" },
      parser: "json",
      parserOptions: {},
      llmOptions: {},
      executorOptions: {
        functionCall: "auto",
        functions: [
          {
            name: "create_release_note",
            description: "Create a release note draft.",
            parameters: {
              type: "object",
              properties: { title: { type: "string" } },
              required: ["title"],
            },
          },
        ],
      },
      debug: false,
    };

    const output = await runExecutorAction(input, runtime);

    expect(runtime.createLlmExecutor).not.toHaveBeenCalled();
    expect(runtime.createLlmFunctionExecutor).toHaveBeenCalledWith(
      { llm, prompt, parser },
      expect.objectContaining({
        hooks: expect.objectContaining({ onComplete: expect.any(Function) }),
      })
    );
    expect(execute).toHaveBeenCalledWith(input.data, input.executorOptions);
    expect(output).toEqual({
      result:
        '[{"type":"function_use","name":"create_release_note","input":{"title":"Fix login"},"functionId":"call_123"}]',
      json: '[{"type":"function_use","name":"create_release_note","input":{"title":"Fix login"},"functionId":"call_123"}]',
    });
  });
});
