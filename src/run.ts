import type { ActionInput } from "./input";
import { formatActionOutput, type ActionOutput } from "./output";
import {
  createChatPrompt,
  createLlmFunctionExecutor,
  createLlmExecutor,
  createParser,
  useLlm,
} from "llm-exe";

export interface LlmExeRuntime {
  useLlm: typeof useLlm;
  createChatPrompt: typeof createChatPrompt;
  createParser: typeof createParser;
  createLlmExecutor: typeof createLlmExecutor;
  createLlmFunctionExecutor: typeof createLlmFunctionExecutor;
}

export const defaultRuntime: LlmExeRuntime = {
  useLlm,
  createChatPrompt,
  createParser,
  createLlmExecutor,
  createLlmFunctionExecutor,
};

export async function runExecutorAction(
  input: ActionInput,
  runtime: LlmExeRuntime = defaultRuntime
): Promise<ActionOutput> {
  const llmOptions = {
    ...input.llmOptions,
    ...(input.model ? { model: input.model } : {}),
  };
  const llm = runtime.useLlm(input.provider as any, llmOptions as any);
  const prompt = runtime.createChatPrompt(input.system || "", {
    allowUnsafeUserTemplate: true,
  });
  prompt.addUserMessage(input.message);

  const parser = runtime.createParser(input.parser as any, input.parserOptions);
  const executorConfiguration = {
    llm,
    prompt,
    parser,
  } as any;
  const createExecutorOptions = {
    hooks: {
      onComplete(metadata: unknown) {
        if (input.debug) {
          console.log(JSON.stringify(metadata, null, 2));
        }
      },
    },
  };
  const executor = Array.isArray(input.executorOptions.functions)
    ? runtime.createLlmFunctionExecutor(
        executorConfiguration,
        createExecutorOptions
      )
    : runtime.createLlmExecutor(executorConfiguration, createExecutorOptions);

  const result = await executor.execute(
    input.data as any,
    input.executorOptions
  );
  return formatActionOutput(result);
}
