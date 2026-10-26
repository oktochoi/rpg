import { runTrainingGroundScenarios } from '../src/game/combat/training/training-scenarios';

async function main() {
  const lines = await runTrainingGroundScenarios();
  for (const line of lines) {
    console.log(line);
  }
  if (lines.some((line) => line.startsWith('FAIL'))) {
    process.exitCode = 1;
  }
}

void main();
