import { runStep32FlowScenarios } from '../src/game/app-flow/step32-scenarios';

async function main() {
  const lines = await runStep32FlowScenarios();
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
