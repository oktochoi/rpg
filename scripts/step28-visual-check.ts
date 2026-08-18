import { runStep28VisualScenarios } from '../src/game/combat/visual/visual-scenarios';

runStep28VisualScenarios()
  .then((lines) => {
    for (const line of lines) {
      console.log(line);
    }
    if (lines.some((line) => line.startsWith('FAIL'))) {
      process.exitCode = 1;
    }
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
