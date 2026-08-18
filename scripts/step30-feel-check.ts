import { runStep30AudioScenarios } from '../src/game/audio/audio-scenarios';
import { runStep30VerticalSliceScenarios } from '../src/game/feel/vertical-slice-scenarios';

async function main() {
  const lines = [...(await runStep30AudioScenarios()), ...(await runStep30VerticalSliceScenarios())];
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
