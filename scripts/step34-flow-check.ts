import { runStep34FlowScenarios } from '../src/game/app-flow/step34-scenarios';

async function main() {
  const lines = await runStep34FlowScenarios();
  for (const line of lines) {
    console.log(line);
  }
  if (lines.some((line) => line.startsWith('FAIL'))) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
