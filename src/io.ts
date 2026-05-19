import { appendFileSync } from "fs";
import { EOL } from "os";

export interface ActionIo {
  getInput(name: string): string;
  setOutput(name: string, value: string): void;
  info(message: string): void;
  error(message: string): void;
}

export function createActionIo(env: NodeJS.ProcessEnv = process.env): ActionIo {
  return {
    getInput(name) {
      return env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
    },
    setOutput(name, value) {
      const outputFile = env.GITHUB_OUTPUT;
      if (outputFile) {
        const delimiter = `llm_exe_${name}_${Date.now()}`;
        appendFileSync(
          outputFile,
          `${name}<<${delimiter}${EOL}${value}${EOL}${delimiter}${EOL}`,
          "utf8"
        );
        return;
      }

      process.stdout.write(
        `::set-output name=${name}::${escapeCommand(value)}\n`
      );
    },
    info(message) {
      process.stdout.write(`${message}\n`);
    },
    error(message) {
      process.stderr.write(`::error::${escapeCommand(message)}\n`);
    },
  };
}

function escapeCommand(value: string) {
  return value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
