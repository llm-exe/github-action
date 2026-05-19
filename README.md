# llm-exe GitHub Action

Make your GitHub workflows smarter with one LLM step.

Use AI to make decisions, summarize noisy output, and return structured data your workflow can act on.

Built on [`llm-exe`](https://github.com/llm-exe/llm-exe).

## Why use it?

- Useful in minutes: one workflow step, one prompt, one output.
- Workflow-native: branch on booleans, read JSON with `fromJson`, or write summaries to `$GITHUB_STEP_SUMMARY`.
- Built-in parsers for strings, booleans, JSON, numbers, lists, and code blocks.
- Provider-flexible: swap models and providers without rewriting the workflow.

## Minimal Usage

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

## Examples

### Gate expensive checks with yes/no output

Use the `boolean` parser when the workflow needs a simple decision.

```yaml
- uses: actions/checkout@v4

- id: diff
  run: |
    git fetch origin ${{ github.base_ref }} --depth=1
    {
      echo 'files<<EOF'
      git diff --name-only origin/${{ github.base_ref }}...HEAD
      echo 'EOF'
    } >> "$GITHUB_OUTPUT"

- id: needs-e2e
  uses: llm-exe/github-action@v1
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    provider: openai.chat.v1
    model: gpt-4o-mini
    parser: boolean
    system: "You decide whether CI should run extra browser tests."
    message: |
      Changed files:
      {{files}}

      Should this pull request run browser end-to-end tests?
      Answer only yes or no.
    data: |
      {
        "files": ${{ toJSON(steps.diff.outputs.files) }}
      }

- name: Run end-to-end tests
  if: steps.needs-e2e.outputs.result == 'true'
  run: npm run test:e2e
```

### Triage issues as JSON

Use the `json` parser with a schema when later steps need reliable fields.

```yaml
- id: triage
  uses: llm-exe/github-action@v1
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    provider: openai.chat.v1
    model: gpt-4o-mini
    parser: json
    parser-options: |
      {
        "schema": {
          "type": "object",
          "additionalProperties": false,
          "required": ["label", "priority", "summary"],
          "properties": {
            "label": {
              "type": "string",
              "enum": ["bug", "feature", "question", "docs"]
            },
            "priority": {
              "type": "string",
              "enum": ["low", "medium", "high"]
            },
            "summary": { "type": "string" }
          }
        }
      }
    message: |
      Classify this GitHub issue and return JSON matching the schema.

      Title: {{title}}
      Body:
      {{body}}
    data: |
      {
        "title": ${{ toJSON(github.event.issue.title) }},
        "body": ${{ toJSON(github.event.issue.body) }}
      }

- run: |
    echo "Label: ${{ fromJson(steps.triage.outputs.json).label }}"
    echo "Priority: ${{ fromJson(steps.triage.outputs.json).priority }}"
```

### Explain failing tests in the job summary

Turn noisy logs into a short failure report that appears directly on the workflow run.

```yaml
- id: test
  continue-on-error: true
  run: |
    npm test 2>&1 | tee test.log
    echo "exit_code=${PIPESTATUS[0]}" >> "$GITHUB_OUTPUT"
    {
      echo 'log<<EOF'
      tail -n 200 test.log
      echo 'EOF'
    } >> "$GITHUB_OUTPUT"

- id: explain
  if: steps.test.outputs.exit_code != '0'
  uses: llm-exe/github-action@v1
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    provider: openai.chat.v1
    model: gpt-4o-mini
    parser: string
    system: "You summarize CI failures for maintainers."
    message: |
      Summarize the likely cause of this test failure.
      Include the failing test names, the most relevant error, and one next step.

      Log:
      {{log}}
    data: |
      {
        "log": ${{ toJSON(steps.test.outputs.log) }}
      }

- if: steps.test.outputs.exit_code != '0'
  run: |
    cat >> "$GITHUB_STEP_SUMMARY" <<'EOF'
    ${{ steps.explain.outputs.result }}
    EOF
    exit 1
```

## Advanced

### Tool calls

Pass function definitions through `executor-options` when you want the model to choose a structured tool call. The action returns the selected call as JSON; a later workflow step can decide what to do with it.

```yaml
- id: release-plan
  uses: llm-exe/github-action@v1
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    provider: openai.chat.v1
    model: gpt-4o-mini
    parser: string
    message: |
      Pick the best tool for this pull request.

      Title: {{title}}
      Body:
      {{body}}
    data: |
      {
        "title": ${{ toJSON(github.event.pull_request.title) }},
        "body": ${{ toJSON(github.event.pull_request.body) }}
      }
    executor-options: |
      {
        "functionCall": "auto",
        "functions": [
          {
            "name": "draft_release_notes",
            "description": "Draft release notes for a user-facing change.",
            "parameters": {
              "type": "object",
              "required": ["title", "bullets"],
              "properties": {
                "title": { "type": "string" },
                "bullets": {
                  "type": "array",
                  "items": { "type": "string" }
                }
              }
            }
          },
          {
            "name": "skip_release_notes",
            "description": "Use when the change is internal-only.",
            "parameters": {
              "type": "object",
              "required": ["reason"],
              "properties": {
                "reason": { "type": "string" }
              }
            }
          }
        ]
      }

- run: echo '${{ steps.release-plan.outputs.json }}'
```

## Inputs

Required:

- `provider`: Provider key passed to `useLlm`.
- `message`: User message template added with `prompt.addUserMessage`.

Optional:

- `model`: Model merged into `useLlm` options.
- `system`: First argument to `createChatPrompt`.
- `data`: JSON object passed to `executor.execute`. Defaults to `{}`.
- `parser`: Parser name passed to `createParser`. Defaults to `string`.
- `parser-options`: JSON object passed to `createParser`. Defaults to `{}`.
- `llm-options`: JSON object merged into `useLlm` options. Defaults to `{}`.
- `executor-options`: JSON object passed to `executor.execute`. Supports `jsonSchema`, `functions`, and `functionCall`. Defaults to `{}`.
- `debug`: Log executor completion metadata. Defaults to `false`.

## Outputs

- `result`: Executor result as a string. Objects and arrays are JSON-stringified.
- `json`: Executor result JSON-stringified for use with `fromJson`.

Authentication stays with `llm-exe` defaults. Set the provider environment variables the package already reads, such as `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`, or `DEEPSEEK_API_KEY`.

## How It Works

The action is intentionally thin. It builds the same `llm-exe` primitives you would use in application code, then exposes the executor result to later workflow steps:

```ts
const llm = useLlm(provider, { ...llmOptions, model });

const prompt = createChatPrompt(system, { allowUnsafeUserTemplate: true });
prompt.addUserMessage(message);

const parser = createParser(parser, parserOptions);
const executor = createLlmExecutor({ llm, prompt, parser });

const result = await executor.execute(data, executorOptions);
```
