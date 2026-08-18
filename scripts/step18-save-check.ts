import { runStep18SaveScenarios } from '../src/game/save/save-scenarios';

runStep18SaveScenarios()
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
