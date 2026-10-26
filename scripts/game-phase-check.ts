import { runGamePhaseScenarios } from '../src/game/story/game-phase-scenarios';

async function main() {
  const lines = await runGamePhaseScenarios();
  for (const line of lines) {
    console.log(line);
  }
  if (lines.some((line) => line.startsWith('FAIL'))) {
    process.exitCode = 1;
  }
}

void main();
