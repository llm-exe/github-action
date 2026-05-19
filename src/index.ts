import { createActionIo } from "./io";
import { readActionInput } from "./input";
import { runExecutorAction } from "./run";

async function main() {
  const io = createActionIo();

  try {
    const input = readActionInput(io);
    const output = await runExecutorAction(input);
    io.setOutput("result", output.result);
    io.setOutput("json", output.json);
  } catch (error) {
    io.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

void main();
