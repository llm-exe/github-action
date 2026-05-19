import type { ActionInput } from "./input";
import { formatActionOutput, type ActionOutput } from "./output";
import {
  createChatPrompt,
  createLlmExecutor,
  createParser,
  useLlm,
} from "llm-exe";

export interface LlmExeRuntime {
  useLlm: typeof useLlm;
  createChatPrompt: typeof createChatPrompt;
  createParser: typeof createParser;
  createLlmExecutor: typeof createLlmExecutor;
}

export const defaultRuntime: LlmExeRuntime = {
  useLlm,
  createChatPrompt,
  createParser,
  createLlmExecutor,
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
  const executor = runtime.createLlmExecutor(
    {
      llm,
      prompt,
      parser,
    } as any,
    {
      hooks: {
        onComplete(metadata) {
          if (input.debug) {
            console.log(JSON.stringify(metadata, null, 2));
          }
        },
      },
    }
  );

  const result = await executor.execute(
    input.data as any,
    input.executorOptions
  );
  return formatActionOutput(result);
}
