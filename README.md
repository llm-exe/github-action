# llm-exe GitHub Action

Run an `llm-exe` executor inside a GitHub Actions workflow.

```yaml
- id: llm
  uses: llm-exe/github-action@v1
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    provider: openai.chat.v1
    model: gpt-4o-mini
    system: "You are concise."
    message: "Summarize this: {{input}}"
    data: |
      {
        "input": "${{ steps.tests.outputs.summary }}"
      }
    parser: string
```

Use the result in later steps:

```yaml
- run: echo '${{ steps.llm.outputs.result }}'
```

## Inputs

| Input              | Required | Default  | Description                                                      |
| ------------------ | -------- | -------- | ---------------------------------------------------------------- |
| `provider`         | Yes      |          | Provider key passed to `useLlm`.                                 |
| `model`            | No       |          | Optional model merged into `useLlm` options.                     |
| `system`           | No       |          | Optional first argument to `createChatPrompt`.                   |
| `message`          | Yes      |          | User message template added with `prompt.addUserMessage`.        |
| `data`             | No       | `{}`     | JSON object passed to `executor.execute`.                        |
| `parser`           | No       | `string` | Parser name passed to `createParser`.                            |
| `parser-options`   | No       | `{}`     | JSON object passed to `createParser`.                            |
| `llm-options`      | No       | `{}`     | JSON object merged into `useLlm` options.                        |
| `executor-options` | No       | `{}`     | JSON object passed as the second argument to `executor.execute`. |
| `debug`            | No       | `false`  | Log executor completion metadata.                                |

## Outputs

| Output   | Description                                                           |
| -------- | --------------------------------------------------------------------- |
| `result` | Executor result as a string. Objects and arrays are JSON-stringified. |
| `json`   | Executor result JSON-stringified for use with `fromJson`.             |

Authentication stays with `llm-exe` defaults. Set the provider environment
variables the package already reads, such as `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`, or `DEEPSEEK_API_KEY`.

## How It Works

The action is intentionally thin. It builds the same `llm-exe` primitives you
would use in application code, then exposes the executor result to later
workflow steps:

```ts
const llm = useLlm(provider, { ...llmOptions, model });

const prompt = createChatPrompt(system, { allowUnsafeUserTemplate: true });
prompt.addUserMessage(message);

const parser = createParser(parser, parserOptions);
const executor = createLlmExecutor({ llm, prompt, parser });

const result = await executor.execute(data, executorOptions);
```
